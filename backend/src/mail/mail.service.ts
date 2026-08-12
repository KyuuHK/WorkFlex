import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import { PdfService, PdfReservation } from './pdf.service';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly brevoApiKey: string | null;
  private readonly from: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;

  constructor(
    private readonly pdf: PdfService,
    config: ConfigService,
  ) {
    const host = config.get<string>('MAIL_HOST');
    const user = config.get<string>('MAIL_USER');
    const pass = config.get<string>('MAIL_PASS');
    const from = config.get<string>('MAIL_FROM');
    const rawPort = config.get<string>('MAIL_PORT');
    const port = rawPort ? Number(rawPort) : 587;
    const enabled = config.get<string>('MAIL_ENABLED') !== 'false';
    const apiKey = config.get<string>('BREVO_API_KEY');

    this.smtpHost = host ?? '';
    this.smtpPort = port;
    this.brevoApiKey = apiKey ?? null;
    this.from = from ?? '';

    if (enabled && apiKey) {
      this.transporter = null;
      this.logger.log('Brevo REST API configured, reservation emails enabled.');
    } else if (enabled && host && user && pass && from) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 30_000,
      });
      this.logger.log(
        `SMTP configured (${host}:${port}), reservation emails enabled.`,
      );
    } else {
      this.transporter = null;
      this.logger.warn(
        'Correo no configurado — los correos de reserva se omitirán (modo dev).',
      );
    }
  }

  async sendReservationConfirmation(data: PdfReservation) {
    const pdf = await this.pdf.generateReservationPdf(data);
    return this.send({
      to: data.userEmail,
      subject: `WorkFlex · Reserva confirmada — ${data.spaceName}`,
      html: this.buildConfirmationHtml(data),
      attachments: [
        {
          filename: `reserva-workflex-${data.id}.pdf`,
          content: pdf,
        },
      ],
    });
  }

  onModuleDestroy() {
    if (this.transporter) {
      this.transporter.close();
    }
  }

  private async send(message: SendMailOptions) {
    if (this.brevoApiKey) {
      await this.sendViaBrevoRest(message);
      return;
    }
    if (!this.transporter) {
      this.logger.log(
        `[mail-skip] Enviaría a ${this.formatRecipient(message.to)}: "${message.subject}"`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
      this.logger.log(`Correo enviado a ${this.formatRecipient(message.to)}`);
    } catch (error) {
      this.logger.error(
        `Fallo al enviar correo vía ${this.smtpHost}:${this.smtpPort} — ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw error;
    }
  }

  private async sendViaBrevoRest(message: SendMailOptions) {
    const to = this.recipients(message.to);
    const attachments = (message.attachments ?? [])
      .filter(
        (attachment) =>
          Buffer.isBuffer(attachment.content) ||
          typeof attachment.content === 'string',
      )
      .map((attachment) => ({
        name: attachment.filename ?? 'attachment',
        content: Buffer.isBuffer(attachment.content)
          ? attachment.content.toString('base64')
          : attachment.content,
      }));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.brevoApiKey as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.parseSender(this.from),
        to: to.map((email) => ({ email })),
        subject: message.subject,
        htmlContent: typeof message.html === 'string' ? message.html : '',
        ...(attachments.length > 0 ? { attachment: attachments } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Brevo API ${response.status}: ${body.slice(0, 500)}`);
      throw new Error(`Brevo API ${response.status}: ${body.slice(0, 300)}`);
    }

    this.logger.log(`Correo enviado a ${to.join(', ')}`);
  }

  private recipients(to: SendMailOptions['to']): string[] {
    if (typeof to === 'string') return [to];
    if (Array.isArray(to)) {
      return to.map((entry) =>
        typeof entry === 'string' ? entry : entry.address,
      );
    }
    return to ? [to.address] : [];
  }

  private parseSender(from: string): { name?: string; email: string } {
    const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
      return { name: match[1].trim(), email: match[2] };
    }
    return { email: from.trim() };
  }

  private formatRecipient(to: SendMailOptions['to']): string {
    if (typeof to === 'string') return to;
    if (Array.isArray(to)) {
      return to
        .map((entry) => (typeof entry === 'string' ? entry : entry.address))
        .join(', ');
    }
    return to ? to.address : '';
  }

  private buildConfirmationHtml(data: PdfReservation): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
        <div style="background:#4f46e5;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;color:#fff;font-size:22px;">WorkFlex</h1>
          <p style="margin:4px 0 0;color:#e0e7ff;font-size:12px;">Confirmación de reserva</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 16px;">Hola <strong>${this.escapeHtml(data.userName)}</strong>, tu reserva fue confirmada:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${this.htmlRow('Espacio', data.spaceName)}
            ${this.htmlRow('Ciudad', data.spaceCity)}
            ${this.htmlRow('Tipo', data.spaceTypeLabel)}
            ${this.htmlRow('Inicio', this.formatDate(data.startAt))}
            ${this.htmlRow('Fin', this.formatDate(data.endAt))}
            ${this.htmlRow('Tarifa', `$${data.pricePerHour.toFixed(2)} / hora`)}
            ${this.htmlRow('Total', `$${data.total.toFixed(2)}`, true)}
          </table>
          <p style="margin-top:20px;font-size:12px;color:#6b7280;">
            Adjuntamos el comprobante en PDF. Puedes gestionar esta reserva desde tu dashboard.
          </p>
        </div>
      </div>
    `;
  }

  private htmlRow(label: string, value: string, highlight = false): string {
    const valueStyle = highlight
      ? 'font-weight:700;color:#4f46e5;font-size:16px;'
      : 'font-weight:600;';
    return `
      <tr>
        <td style="padding:6px 0;color:#6b7280;">${label}</td>
        <td style="padding:6px 0;text-align:right;${valueStyle}">${this.escapeHtml(value)}</td>
      </tr>
    `;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

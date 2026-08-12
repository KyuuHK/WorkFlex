import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface PdfReservation {
  id: string;
  userName: string;
  userEmail: string;
  spaceName: string;
  spaceCity: string;
  spaceTypeLabel: string;
  startAt: Date;
  endAt: Date;
  pricePerHour: number;
  total: number;
}

const INDIGO = '#4f46e5';
const GRAY = '#6b7280';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  generateReservationPdf(data: PdfReservation): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc);
      this.drawBody(doc, data);

      doc.end();
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument) {
    doc.rect(0, 0, doc.page.width, 88).fill(INDIGO);
    doc
      .fill('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('WorkFlex', 48, 26);
    doc
      .font('Helvetica')
      .fontSize(10)
      .text('Sistema de reserva de espacios de coworking', 48, 58);
  }

  private drawBody(doc: PDFKit.PDFDocument, data: PdfReservation) {
    doc
      .fill('#111827')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Confirmación de reserva', 48, 120);

    doc
      .fill(GRAY)
      .font('Helvetica')
      .fontSize(10)
      .text(
        `Reserva ${data.id} · Generado el ${this.formatDate(new Date())}`,
        48,
        146,
      );

    doc
      .moveTo(48, 172)
      .lineTo(doc.page.width - 48, 172)
      .strokeColor('#e5e7eb')
      .stroke();

    this.drawSection(doc, 'Datos del cliente', [
      { label: 'Nombre', value: data.userName },
      { label: 'Correo', value: data.userEmail },
    ]);

    this.drawSection(doc, 'Espacio reservado', [
      { label: 'Espacio', value: data.spaceName },
      { label: 'Ciudad', value: data.spaceCity },
      { label: 'Tipo', value: data.spaceTypeLabel },
      { label: 'Inicio', value: this.formatDate(data.startAt) },
      { label: 'Fin', value: this.formatDate(data.endAt) },
      {
        label: 'Tarifa',
        value: `$${data.pricePerHour.toFixed(2)} por hora`,
      },
    ]);

    this.drawTotal(doc, data.total);

    doc
      .fontSize(9)
      .fill(GRAY)
      .text(
        'Gracias por elegir WorkFlex. Este documento es tu comprobante de reserva.',
        48,
        doc.page.height - 80,
      );
  }

  private drawSection(
    doc: PDFKit.PDFDocument,
    title: string,
    rows: Array<{ label: string; value: string }>,
  ) {
    doc
      .fill('#111827')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(title, 48, doc.y + 24);

    doc
      .moveTo(48, doc.y + 8)
      .lineTo(doc.page.width - 48, doc.y + 8)
      .strokeColor('#e5e7eb')
      .stroke();

    let rowY = doc.y + 20;
    for (const row of rows) {
      doc
        .fill('#4b5563')
        .font('Helvetica')
        .fontSize(10)
        .text(row.label, 48, rowY);
      doc
        .fill('#111827')
        .font('Helvetica-Bold')
        .text(row.value, doc.page.width - 260, rowY);
      rowY += 20;
    }
    doc.y = rowY;
  }

  private drawTotal(doc: PDFKit.PDFDocument, total: number) {
    doc
      .moveTo(48, doc.y + 24)
      .lineTo(doc.page.width - 48, doc.y + 24)
      .strokeColor('#e5e7eb')
      .stroke();

    const boxY = doc.y + 16;
    doc.rect(48, boxY, doc.page.width - 96, 34).fill('#eef2ff');
    doc
      .fill('#111827')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total', 64, boxY + 10);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`$${total.toFixed(2)}`, doc.page.width - 128, boxY + 9);

    doc.y = boxY + 60;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}

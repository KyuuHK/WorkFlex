import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './pdf.service';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

const reservationData = {
  id: 'res-1',
  userName: 'Jose Abrego',
  userEmail: 'jose@workflex.app',
  spaceName: 'The Vault Coworking',
  spaceCity: 'Panama City',
  spaceTypeLabel: 'Escritorio',
  startAt: new Date('2026-08-12T14:00:00.000Z'),
  endAt: new Date('2026-08-12T16:00:00.000Z'),
  pricePerHour: 3.5,
  total: 7,
};

describe('MailService', () => {
  describe('when SMTP is not configured', () => {
    let service: MailService;

    beforeEach(async () => {
      mockedNodemailer.createTransport.mockClear();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue(undefined) },
          },
          {
            provide: PdfService,
            useValue: {
              generateReservationPdf: jest
                .fn()
                .mockResolvedValue(Buffer.from('fake-pdf')),
            },
          },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('creates no transporter', () => {
      expect(mockedNodemailer.createTransport).not.toHaveBeenCalled();
    });

    it('skips sending without throwing', async () => {
      await expect(
        service.sendReservationConfirmation(reservationData),
      ).resolves.toBeUndefined();
    });
  });

  describe('when SMTP is configured', () => {
    let service: MailService;
    let sentOptions: nodemailer.SendMailOptions;

    beforeEach(async () => {
      sentOptions = {};
      const sendMail = jest.fn((options: nodemailer.SendMailOptions) => {
        sentOptions = options;
        return Promise.resolve({ messageId: 'id-1' });
      });
      mockedNodemailer.createTransport.mockReturnValue({
        sendMail,
        close: jest.fn(),
      } as never);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string) => {
                const values: Record<string, unknown> = {
                  MAIL_HOST: 'smtp.example.com',
                  MAIL_USER: 'smtp-user',
                  MAIL_PASS: 'smtp-pass',
                  MAIL_FROM: 'no-reply@workflex.app',
                  MAIL_PORT: 587,
                };
                return values[key];
              }),
            },
          },
          {
            provide: PdfService,
            useValue: {
              generateReservationPdf: jest
                .fn()
                .mockResolvedValue(Buffer.from('fake-pdf')),
            },
          },
        ],
      }).compile();

      service = module.get<MailService>(MailService);
    });

    it('sends an email with the PDF attachment', async () => {
      await service.sendReservationConfirmation(reservationData);

      expect(sentOptions.from).toBe('no-reply@workflex.app');
      expect(sentOptions.to).toBe('jose@workflex.app');
      expect(sentOptions.subject).toContain('The Vault Coworking');
      expect(sentOptions.attachments).toHaveLength(1);
      expect(sentOptions.attachments?.[0].filename).toBe(
        'reserva-workflex-res-1.pdf',
      );
    });
  });
});

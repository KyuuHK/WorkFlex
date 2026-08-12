import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, SpaceType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: {
    space: { findUnique: jest.Mock };
    reservation: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const spaceRecord = {
    id: 'space-1',
    name: 'The Vault Coworking',
    city: 'Panama City',
    type: SpaceType.DESK,
    pricePerHour: '3.50',
    capacity: 1,
    description: 'A hot desk.',
  };

  const reservationRecord = {
    id: 'res-1',
    userId: 'user-1',
    spaceId: 'space-1',
    startAt: new Date('2026-08-12T14:00:00.000Z'),
    endAt: new Date('2026-08-12T16:00:00.000Z'),
    status: ReservationStatus.CONFIRMED,
    createdAt: new Date(),
    space: spaceRecord,
  };

  beforeEach(async () => {
    prisma = {
      space: { findUnique: jest.fn() },
      reservation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  describe('create', () => {
    it('creates a confirmed reservation when the space is free', async () => {
      prisma.space.findUnique.mockResolvedValue(spaceRecord);
      prisma.reservation.findFirst.mockResolvedValue(null);
      prisma.reservation.create.mockResolvedValue(reservationRecord);

      const result = await service.create('user-1', {
        spaceId: 'space-1',
        startAt: '2026-08-12T14:00:00.000Z',
        endAt: '2026-08-12T16:00:00.000Z',
      });

      expect(prisma.reservation.findFirst).toHaveBeenCalledWith({
        where: {
          spaceId: 'space-1',
          status: {
            in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
          },
          startAt: { lt: new Date('2026-08-12T16:00:00.000Z') },
          endAt: { gt: new Date('2026-08-12T14:00:00.000Z') },
        },
      });
      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          spaceId: 'space-1',
          startAt: new Date('2026-08-12T14:00:00.000Z'),
          endAt: new Date('2026-08-12T16:00:00.000Z'),
          status: ReservationStatus.CONFIRMED,
        },
        include: { space: true },
      });
      expect(result.space.pricePerHour).toBe(3.5);
    });

    it('throws NotFoundException for an unknown space', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          spaceId: 'missing',
          startAt: '2026-08-12T14:00:00.000Z',
          endAt: '2026-08-12T16:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when endAt is not after startAt', async () => {
      prisma.space.findUnique.mockResolvedValue(spaceRecord);

      await expect(
        service.create('user-1', {
          spaceId: 'space-1',
          startAt: '2026-08-12T16:00:00.000Z',
          endAt: '2026-08-12T14:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when the slot overlaps an active reservation', async () => {
      prisma.space.findUnique.mockResolvedValue(spaceRecord);
      prisma.reservation.findFirst.mockResolvedValue(reservationRecord);

      await expect(
        service.create('user-1', {
          spaceId: 'space-1',
          startAt: '2026-08-12T15:00:00.000Z',
          endAt: '2026-08-12T17:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAllForUser', () => {
    it('returns the serialized reservations of the user', async () => {
      prisma.reservation.findMany.mockResolvedValue([reservationRecord]);

      const result = await service.findAllForUser('user-1');

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { space: true },
        orderBy: { startAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].space.pricePerHour).toBe(3.5);
    });
  });

  describe('cancel', () => {
    it('cancels a reservation owned by the user', async () => {
      prisma.reservation.findUnique.mockResolvedValue(reservationRecord);
      prisma.reservation.update.mockResolvedValue({
        ...reservationRecord,
        status: ReservationStatus.CANCELLED,
      });

      const result = await service.cancel('user-1', 'res-1');

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: ReservationStatus.CANCELLED },
        include: { space: true },
      });
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('throws NotFoundException when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.cancel('user-1', 'missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the reservation belongs to another user', async () => {
      prisma.reservation.findUnique.mockResolvedValue(reservationRecord);

      await expect(service.cancel('user-2', 'res-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when already cancelled', async () => {
      prisma.reservation.findUnique.mockResolvedValue({
        ...reservationRecord,
        status: ReservationStatus.CANCELLED,
      });

      await expect(service.cancel('user-1', 'res-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});

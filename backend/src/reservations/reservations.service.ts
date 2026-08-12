import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, SpaceType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

export interface ReservationResponse {
  id: string;
  spaceId: string;
  startAt: Date;
  endAt: Date;
  status: ReservationStatus;
  createdAt: Date;
  space: {
    id: string;
    name: string;
    city: string;
    type: SpaceType;
    pricePerHour: number;
    capacity: number;
    description: string | null;
  };
}

const ACTIVE_STATUSES: ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReservationDto) {
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be later than startAt');
    }

    const conflict = await this.prisma.reservation.findFirst({
      where: {
        spaceId: dto.spaceId,
        status: { in: ACTIVE_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) {
      throw new ConflictException(
        'Space is already booked for the requested time range',
      );
    }

    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        spaceId: dto.spaceId,
        startAt,
        endAt,
        status: ReservationStatus.CONFIRMED,
      },
      include: { space: true },
    });

    return this.serialize(reservation);
  }

  async findAllForUser(userId: string): Promise<ReservationResponse[]> {
    const reservations = await this.prisma.reservation.findMany({
      where: { userId },
      include: { space: true },
      orderBy: { startAt: 'desc' },
    });
    return reservations.map((reservation) => this.serialize(reservation));
  }

  async cancel(userId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    if (reservation.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own reservations');
    }
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    return this.serialize(
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CANCELLED },
        include: { space: true },
      }),
    );
  }

  private serialize(reservation: {
    id: string;
    spaceId: string;
    startAt: Date;
    endAt: Date;
    status: ReservationStatus;
    createdAt: Date;
    space: {
      id: string;
      name: string;
      city: string;
      type: SpaceType;
      pricePerHour: unknown;
      capacity: number;
      description: string | null;
    };
  }): ReservationResponse {
    return {
      id: reservation.id,
      spaceId: reservation.spaceId,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      status: reservation.status,
      createdAt: reservation.createdAt,
      space: {
        ...reservation.space,
        pricePerHour: Number(reservation.space.pricePerHour),
      },
    };
  }
}

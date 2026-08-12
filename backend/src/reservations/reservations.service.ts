import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, SpaceType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

const TYPE_LABELS: Record<SpaceType, string> = {
  DESK: 'Escritorio',
  PRIVATE_OFFICE: 'Oficina privada',
};

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
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

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

    const result = this.serialize(reservation);
    void this.notifyUser(userId, result, startAt, endAt);

    return result;
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

  private async notifyUser(
    userId: string,
    reservation: ReservationResponse,
    startAt: Date,
    endAt: Date,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      const hours = (endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000);

      await this.mail.sendReservationConfirmation({
        id: reservation.id,
        userName: user?.name ?? 'Cliente',
        userEmail: user?.email ?? '',
        spaceName: reservation.space.name,
        spaceCity: reservation.space.city,
        spaceTypeLabel: TYPE_LABELS[reservation.space.type],
        startAt,
        endAt,
        pricePerHour: reservation.space.pricePerHour,
        total: hours * reservation.space.pricePerHour,
      });
    } catch (error) {
      this.logger.error(
        'No se pudo enviar el correo de confirmación',
        error instanceof Error ? error.stack : undefined,
      );
    }
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

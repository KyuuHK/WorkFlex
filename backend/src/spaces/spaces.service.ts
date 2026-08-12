import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReservationStatus,
  SpaceType,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySpacesDto } from './dto/query-spaces.dto';

export interface SpaceResponse {
  id: string;
  name: string;
  city: string;
  type: SpaceType;
  pricePerHour: number;
  capacity: number;
  description: string | null;
}

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySpacesDto): Promise<SpaceResponse[]> {
    const where: Prisma.SpaceWhereInput = {};

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.pricePerHour = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const spaces = await this.prisma.space.findMany({
      where,
      orderBy: { pricePerHour: 'asc' },
    });

    return spaces.map((space) => this.serialize(space));
  }

  async findOne(id: string): Promise<SpaceResponse> {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException(`Space with id ${id} not found`);
    }
    return this.serialize(space);
  }

  async findCities(): Promise<string[]> {
    const cities = await this.prisma.space.findMany({
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return cities.map((city) => city.city);
  }

  async getAvailability(id: string, date: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });
    if (!space) {
      throw new NotFoundException(`Space with id ${id} not found`);
    }

    const windowStart = new Date(`${date}T09:00:00`);
    const windowEnd = new Date(`${date}T18:00:00`);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        spaceId: id,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
        startAt: { lt: windowEnd },
        endAt: { gt: windowStart },
      },
    });

    const slots: Array<{
      startAt: string;
      endAt: string;
      available: boolean;
    }> = [];

    for (let hour = 9; hour < 18; hour++) {
      const slotStart = new Date(
        `${date}T${String(hour).padStart(2, '0')}:00:00`,
      );
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const available = !reservations.some(
        (reservation) =>
          reservation.startAt < slotEnd && reservation.endAt > slotStart,
      );
      slots.push({
        startAt: slotStart.toISOString(),
        endAt: slotEnd.toISOString(),
        available,
      });
    }

    return slots;
  }

  private serialize(space: {
    id: string;
    name: string;
    city: string;
    type: SpaceType;
    pricePerHour: unknown;
    capacity: number;
    description: string | null;
  }): SpaceResponse {
    return {
      ...space,
      pricePerHour: Number(space.pricePerHour),
    };
  }
}

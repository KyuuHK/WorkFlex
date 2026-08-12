import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SpaceType } from '../../generated/prisma/client';
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

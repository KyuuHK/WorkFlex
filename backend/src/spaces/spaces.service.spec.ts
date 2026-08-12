import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from './spaces.service';
import { SpaceType } from '../../generated/prisma/client';

describe('SpacesService', () => {
  let service: SpacesService;
  let prisma: {
    space: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findCities?: never;
    };
  };

  const spaceRecord = {
    id: 'space-1',
    name: 'The Vault Coworking',
    city: 'Panama City',
    type: SpaceType.DESK,
    pricePerHour: '3.50',
    capacity: 1,
    description: 'Hot desk in a vibrant shared space.',
  };

  beforeEach(async () => {
    prisma = {
      space: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SpacesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SpacesService>(SpacesService);
  });

  describe('findAll', () => {
    it('returns serialized spaces ordered by price', async () => {
      prisma.space.findMany.mockResolvedValue([spaceRecord]);

      const result = await service.findAll({});

      expect(prisma.space.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { pricePerHour: 'asc' },
      });
      expect(result).toEqual([{ ...spaceRecord, pricePerHour: 3.5 }]);
    });

    it('passes city, type and price filters to the query', async () => {
      prisma.space.findMany.mockResolvedValue([]);

      await service.findAll({
        city: 'panama',
        type: SpaceType.PRIVATE_OFFICE,
        minPrice: 5,
        maxPrice: 15,
      });

      expect(prisma.space.findMany).toHaveBeenCalledWith({
        where: {
          city: { contains: 'panama', mode: 'insensitive' },
          type: SpaceType.PRIVATE_OFFICE,
          pricePerHour: { gte: 5, lte: 15 },
        },
        orderBy: { pricePerHour: 'asc' },
      });
    });

    it('searches by name or description when q is provided', async () => {
      prisma.space.findMany.mockResolvedValue([]);

      await service.findAll({ q: 'vault' });

      expect(prisma.space.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'vault', mode: 'insensitive' } },
            { description: { contains: 'vault', mode: 'insensitive' } },
          ],
        },
        orderBy: { pricePerHour: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the serialized space when found', async () => {
      prisma.space.findUnique.mockResolvedValue(spaceRecord);

      const result = await service.findOne('space-1');

      expect(prisma.space.findUnique).toHaveBeenCalledWith({
        where: { id: 'space-1' },
      });
      expect(result).toEqual({ ...spaceRecord, pricePerHour: 3.5 });
    });

    it('throws NotFoundException when the space does not exist', async () => {
      prisma.space.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findCities', () => {
    it('returns a distinct sorted list of cities', async () => {
      prisma.space.findMany.mockResolvedValue([
        { city: 'Bogota' },
        { city: 'Panama City' },
      ]);

      const result = await service.findCities();

      expect(prisma.space.findMany).toHaveBeenCalledWith({
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      });
      expect(result).toEqual(['Bogota', 'Panama City']);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
  };
  let jwt: { signAsync: jest.Mock };

  const userRecord = {
    id: 'user-1',
    email: 'jose@workflex.app',
    name: 'Jose Abrego',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates a user and returns an access token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(userRecord);
      mockedBcrypt.hash.mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'JOSE@workflex.app',
        name: 'Jose Abrego',
        password: 'SuperSecret123',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'jose@workflex.app' }) as object,
      });
      expect(result.accessToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('throws ConflictException when the email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(userRecord);

      await expect(
        service.register({
          email: 'jose@workflex.app',
          name: 'Jose Abrego',
          password: 'SuperSecret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(userRecord);
      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'jose@workflex.app',
        password: 'SuperSecret123',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.id).toBe('user-1');
    });

    it('throws UnauthorizedException for a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(userRecord);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'jose@workflex.app',
          password: 'WrongPassword123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException for an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'ghost@workflex.app',
          password: 'SuperSecret123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});

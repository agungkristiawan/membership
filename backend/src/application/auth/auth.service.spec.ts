import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { User } from '../../domain/entities/user.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  username: 'testuser',
  password: 'hashed',
  full_name: 'Test User',
  email: 'test@example.com',
  role: 'member',
  status: 'active',
  join_date: new Date('2024-01-01'),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

const makeToken = (overrides: Partial<RefreshToken> = {}): RefreshToken => ({
  id: 'token-1',
  token: 'hashed-token',
  user_id: 'user-1',
  expires_at: new Date(Date.now() + 86400000),
  revoked: false,
  created_at: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<UserRepository>;
  let tokenRepo: jest.Mocked<RefreshTokenRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    userRepo = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      upsertByUsername: jest.fn(),
    } as jest.Mocked<UserRepository>;

    tokenRepo = {
      findByToken: jest.fn(),
      create: jest.fn(),
      revokeByToken: jest.fn(),
      revokeAllForUser: jest.fn(),
    } as jest.Mocked<RefreshTokenRepository>;

    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') } as any;
    config = { get: jest.fn().mockReturnValue(3600) } as any;
    tokenRepo.create.mockResolvedValue(makeToken());

    service = new AuthService(userRepo, tokenRepo, jwtService, config);
  });

  describe('login', () => {
    it('throws 401 when user not found', async () => {
      userRepo.findByUsername.mockResolvedValue(null);
      await expect(service.login({ username: 'x', password: 'y' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when password is wrong', async () => {
      userRepo.findByUsername.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.login({ username: 'testuser', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when account is inactive', async () => {
      userRepo.findByUsername.mockResolvedValue(makeUser({ status: 'inactive' }));
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await expect(service.login({ username: 'testuser', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and user on success', async () => {
      userRepo.findByUsername.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      const result = await service.login({ username: 'testuser', password: 'pass' });
      expect(result.access_token).toBe('jwt-token');
      expect(result.refresh_token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('refresh', () => {
    it('throws 401 when token not found', async () => {
      tokenRepo.findByToken.mockResolvedValue(null);
      await expect(service.refresh({ refresh_token: 'bad' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when token is revoked', async () => {
      tokenRepo.findByToken.mockResolvedValue(makeToken({ revoked: true }));
      await expect(service.refresh({ refresh_token: 'revoked' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when token is expired', async () => {
      tokenRepo.findByToken.mockResolvedValue(
        makeToken({ expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(service.refresh({ refresh_token: 'expired' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when user is deleted', async () => {
      tokenRepo.findByToken.mockResolvedValue(makeToken());
      userRepo.findById.mockResolvedValue(makeUser({ deleted_at: new Date() }));
      await expect(service.refresh({ refresh_token: 'tok' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('revokes old token and issues new tokens on success', async () => {
      tokenRepo.findByToken.mockResolvedValue(makeToken());
      userRepo.findById.mockResolvedValue(makeUser());
      const result = await service.refresh({ refresh_token: 'valid' });
      expect(tokenRepo.revokeByToken).toHaveBeenCalledTimes(1);
      expect(result.access_token).toBe('jwt-token');
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      await service.logout('user-1', { refresh_token: 'tok' });
      expect(tokenRepo.revokeByToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMe', () => {
    it('throws 401 when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.getMe('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('returns user DTO', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      const result = await service.getMe('user-1');
      expect(result.email).toBe('test@example.com');
      expect(result.role).toBe('member');
    });

    it('prefixes relative photo_url with BACKEND_URL', async () => {
      process.env.BACKEND_URL = 'http://localhost:3000';
      userRepo.findById.mockResolvedValue(makeUser({ photo_url: '/uploads/photo.jpg' }));
      const result = await service.getMe('user-1');
      expect(result.photo_url).toBe('http://localhost:3000/uploads/photo.jpg');
    });
  });

  describe('changePassword', () => {
    it('throws 401 when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.changePassword('missing', 'old', 'new123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws 401 when current password is wrong', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(service.changePassword('user-1', 'wrongpass', 'new123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('updates password on success', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.changePassword('user-1', 'correct', 'newpass123');
      expect(result.message).toBe('Password changed successfully');
      expect(userRepo.updateById).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ password: expect.any(String) }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('throws 404 when email not found', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      await expect(service.requestPasswordReset('none@x.com'))
        .rejects.toThrow(NotFoundException);
    });

    it('returns reset_url and saves token', async () => {
      userRepo.findByEmail.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      config.get.mockImplementation((key: string, def: any) =>
        key === 'FRONTEND_URL' ? 'http://localhost:5173' : def,
      );
      const result = await service.requestPasswordReset('test@example.com');
      expect(result.reset_url).toMatch(/^http:\/\/localhost:5173\/reset-password\/.+/);
      expect(userRepo.updateById).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ password_reset_token: expect.any(String) }),
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('throws 400 when token not found', async () => {
      userRepo.findByPasswordResetToken.mockResolvedValue(null);
      await expect(service.confirmPasswordReset('bad', 'newpass'))
        .rejects.toThrow(BadRequestException);
    });

    it('throws 400 when token is expired', async () => {
      userRepo.findByPasswordResetToken.mockResolvedValue(
        makeUser({ password_reset_expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(service.confirmPasswordReset('expired', 'newpass'))
        .rejects.toThrow(BadRequestException);
    });

    it('updates password and clears token on success', async () => {
      userRepo.findByPasswordResetToken.mockResolvedValue(
        makeUser({ password_reset_expires_at: new Date(Date.now() + 60000) }),
      );
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.confirmPasswordReset('valid', 'newpass123');
      expect(result.message).toBe('Password reset successfully');
      expect(userRepo.updateById).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ password_reset_token: null }),
      );
    });
  });
});

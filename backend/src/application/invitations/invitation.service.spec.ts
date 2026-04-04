import {
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from '../../domain/repositories/invitation.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { AuthService } from '../auth/auth.service';
import { Invitation } from '../../domain/entities/invitation.entity';
import { User } from '../../domain/entities/user.entity';

const makeInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: 'inv-1',
  token: 'valid-token',
  email: 'invitee@example.com',
  full_name: 'New Member',
  invited_by: 'admin-1',
  expires_at: new Date(Date.now() + 86400000),
  used_at: null,
  created_at: new Date(),
  ...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  username: 'newuser',
  password: 'hashed',
  full_name: 'New Member',
  email: 'invitee@example.com',
  role: 'member',
  status: 'active',
  join_date: new Date(),
  hobbies: [],
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('InvitationService', () => {
  let service: InvitationService;
  let invitationRepo: jest.Mocked<InvitationRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let authService: jest.Mocked<AuthService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    invitationRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      markUsed: jest.fn(),
    } as jest.Mocked<InvitationRepository>;

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

    authService = {
      issueTokensPublic: jest.fn().mockResolvedValue({
        access_token: 'jwt',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        user: { id: 'user-1', full_name: 'New Member', email: 'invitee@example.com', role: 'member', photo_url: null },
      }),
    } as any;

    config = {
      get: jest.fn().mockImplementation((key: string, def: any) =>
        key === 'FRONTEND_URL' ? 'http://localhost:5173' : def,
      ),
    } as any;

    service = new InvitationService(invitationRepo, userRepo, authService, config);
  });

  describe('generate', () => {
    it('throws 403 when requester is a regular member', async () => {
      await expect(
        service.generate({ email: 'x@x.com', full_name: 'X' }, 'user-1', 'member'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates invitation and returns link for admin', async () => {
      invitationRepo.create.mockResolvedValue(makeInvitation());
      const result = await service.generate(
        { email: 'x@x.com', full_name: 'X' },
        'admin-1',
        'admin',
      );
      expect(result.invitation_link).toMatch(/^http:\/\/localhost:5173\/register\/.+/);
      expect(result.expires_at).toBeDefined();
    });

    it('creates invitation and returns link for editor', async () => {
      invitationRepo.create.mockResolvedValue(makeInvitation());
      const result = await service.generate(
        { email: 'x@x.com', full_name: 'X' },
        'editor-1',
        'editor',
      );
      expect(result.invitation_link).toBeDefined();
    });
  });

  describe('validate', () => {
    it('throws 400 when token not found', async () => {
      invitationRepo.findByToken.mockResolvedValue(null);
      await expect(service.validate('bad-token')).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when invitation is already used', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation({ used_at: new Date() }));
      await expect(service.validate('used-token')).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when invitation is expired', async () => {
      invitationRepo.findByToken.mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(service.validate('expired-token')).rejects.toThrow(BadRequestException);
    });

    it('returns valid=true with email and name for a valid token', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      const result = await service.validate('valid-token');
      expect(result.valid).toBe(true);
      expect(result.email).toBe('invitee@example.com');
      expect(result.full_name).toBe('New Member');
    });
  });

  describe('register', () => {
    const dto = {
      username: 'newuser',
      password: 'pass123',
      full_name: 'New Member',
      gender: 'male' as const,
      birthdate: '1990-01-01',
    };

    it('throws 400 when token not found', async () => {
      invitationRepo.findByToken.mockResolvedValue(null);
      await expect(service.register('bad', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when invitation is already used', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation({ used_at: new Date() }));
      await expect(service.register('used', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 400 when invitation is expired', async () => {
      invitationRepo.findByToken.mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }),
      );
      await expect(service.register('expired', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws 422 when username already taken', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      userRepo.findByUsername.mockResolvedValue(makeUser());
      await expect(service.register('valid-token', dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws 422 when birthdate makes member younger than minimum age', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      userRepo.findByUsername.mockResolvedValue(null);
      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 16);
      const youngDto = { ...dto, birthdate: tooYoung.toISOString().split('T')[0] };
      await expect(service.register('valid-token', youngDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('accepts birthdate for member exactly at minimum age', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(makeUser());
      const exactAge = new Date();
      exactAge.setFullYear(exactAge.getFullYear() - 17);
      const exactDto = { ...dto, birthdate: exactAge.toISOString().split('T')[0] };
      const result = await service.register('valid-token', exactDto);
      expect(result.message).toBe('Registration successful');
    });

    it('creates user with status=active and marks invitation used', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(makeUser());

      await service.register('valid-token', dto);

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', role: 'member' }),
      );
      expect(invitationRepo.markUsed).toHaveBeenCalledWith('valid-token');
    });

    it('returns auth tokens after successful registration', async () => {
      invitationRepo.findByToken.mockResolvedValue(makeInvitation());
      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.create.mockResolvedValue(makeUser());

      const result = await service.register('valid-token', dto);

      expect(result.message).toBe('Registration successful');
      expect(result.access_token).toBe('jwt');
    });
  });
});

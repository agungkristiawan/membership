import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MemberService } from './member.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  username: 'testuser',
  password: 'hashed',
  full_name: 'Test User',
  email: 'test@example.com',
  role: 'member',
  status: 'active',
  join_date: new Date('2024-01-01'),
  hobbies: [],
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

describe('MemberService', () => {
  let service: MemberService;
  let userRepo: jest.Mocked<UserRepository>;

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

    service = new MemberService(userRepo);
  });

  describe('list', () => {
    it('returns paginated members including role field', async () => {
      const user = makeUser({ role: 'editor' });
      userRepo.findAll.mockResolvedValue({ data: [user], total: 1 });

      const result = await service.list({ page: '1' });

      expect(result.data[0].role).toBe('editor');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.per_page).toBe(25);
    });

    it('prefixes relative photo_url', async () => {
      process.env.BACKEND_URL = 'http://localhost:3000';
      userRepo.findAll.mockResolvedValue({
        data: [makeUser({ photo_url: '/uploads/pic.jpg' })],
        total: 1,
      });

      const result = await service.list({});

      expect(result.data[0].photo_url).toBe('http://localhost:3000/uploads/pic.jpg');
    });

    it('returns null photo_url when not set', async () => {
      userRepo.findAll.mockResolvedValue({ data: [makeUser({ photo_url: undefined })], total: 1 });
      const result = await service.list({});
      expect(result.data[0].photo_url).toBeNull();
    });
  });

  describe('getById', () => {
    it('throws 404 when member not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when member is soft-deleted', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ deleted_at: new Date() }));
      await expect(service.getById('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns full member profile', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ phone: '123', notes: 'hello' }));
      const result = await service.getById('user-1');
      expect(result.email).toBe('test@example.com');
      expect(result.phone).toBe('123');
      expect(result.notes).toBe('hello');
    });
  });

  describe('update', () => {
    it('throws 404 when member not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.update('missing', {}, 'admin-1', 'admin'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws 404 when member is soft-deleted', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ deleted_at: new Date() }));
      await expect(service.update('user-1', {}, 'admin-1', 'admin'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws 403 when member tries to edit another member', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ id: 'user-2' }));
      await expect(service.update('user-2', {}, 'user-1', 'member'))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows member to edit own profile', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.update('user-1', { full_name: 'New Name' }, 'user-1', 'member');
      expect(result.message).toBe('Member updated successfully');
    });

    it('allows editor to edit any member', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ id: 'user-2' }));
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.update('user-2', { full_name: 'New' }, 'editor-1', 'editor');
      expect(result.message).toBe('Member updated successfully');
    });

    it('does not allow member to change status', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      await service.update('user-1', { status: 'inactive' }, 'user-1', 'member');
      const updateCall = userRepo.updateById.mock.calls[0][1] as Record<string, unknown>;
      expect(updateCall.status).toBeUndefined();
    });

    it('allows admin to change status', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      await service.update('user-1', { status: 'inactive' }, 'admin-1', 'admin');
      const updateCall = userRepo.updateById.mock.calls[0][1] as Record<string, unknown>;
      expect(updateCall.status).toBe('inactive');
    });
  });

  describe('updateRole', () => {
    it('throws 403 when changing own role', async () => {
      await expect(service.updateRole('user-1', 'editor', 'user-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws 404 when member not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.updateRole('missing', 'editor', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws 404 when member is soft-deleted', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ deleted_at: new Date() }));
      await expect(service.updateRole('user-1', 'editor', 'admin-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws 400 when promoting to admin and limit of 4 is reached', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ role: 'member' }));
      userRepo.findAll.mockResolvedValue({
        data: [
          makeUser({ id: 'a1', role: 'admin' }),
          makeUser({ id: 'a2', role: 'admin' }),
          makeUser({ id: 'a3', role: 'admin' }),
          makeUser({ id: 'a4', role: 'admin' }),
        ],
        total: 4,
      });
      await expect(service.updateRole('user-1', 'admin', 'admin-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('allows promoting to admin when fewer than 4 admins exist', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ role: 'member' }));
      userRepo.findAll.mockResolvedValue({
        data: [makeUser({ id: 'a1', role: 'admin' })],
        total: 1,
      });
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.updateRole('user-1', 'admin', 'admin-1');
      expect(result.message).toBe('Role updated successfully');
    });

    it('skips admin count check when target is already an admin', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ role: 'admin' }));
      userRepo.updateById.mockResolvedValue(makeUser());
      await service.updateRole('user-1', 'admin', 'admin-1');
      expect(userRepo.findAll).not.toHaveBeenCalled();
    });

    it('updates role on success', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ role: 'member' }));
      userRepo.updateById.mockResolvedValue(makeUser());
      await service.updateRole('user-1', 'editor', 'admin-1');
      expect(userRepo.updateById).toHaveBeenCalledWith('user-1', { role: 'editor' });
    });
  });

  describe('delete', () => {
    it('throws 403 when deleting own account', async () => {
      await expect(service.delete('user-1', 'user-1', 'admin'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws 403 when requester is a regular member', async () => {
      await expect(service.delete('user-2', 'user-1', 'member'))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws 404 when member not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      await expect(service.delete('missing', 'admin-1', 'admin'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws 404 when member already deleted', async () => {
      userRepo.findById.mockResolvedValue(makeUser({ deleted_at: new Date() }));
      await expect(service.delete('user-1', 'admin-1', 'admin'))
        .rejects.toThrow(NotFoundException);
    });

    it('sets deleted_at and returns success message', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.delete('user-1', 'admin-1', 'admin');
      expect(result.message).toBe('Member removed successfully');
      expect(userRepo.updateById).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ deleted_at: expect.any(Date) }),
      );
    });

    it('allows editor to delete a member', async () => {
      userRepo.findById.mockResolvedValue(makeUser());
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.delete('user-1', 'editor-1', 'editor');
      expect(result.message).toBe('Member removed successfully');
    });
  });

  describe('updatePhoto', () => {
    it('returns absolute photo_url after update', async () => {
      process.env.BACKEND_URL = 'http://localhost:3000';
      userRepo.updateById.mockResolvedValue(makeUser());
      const result = await service.updatePhoto('user-1', '/uploads/photo.jpg');
      expect(result.photo_url).toBe('http://localhost:3000/uploads/photo.jpg');
    });
  });
});

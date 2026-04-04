import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
const resolvePhotoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return url.startsWith('/') ? `${backendUrl}${url}` : url;
};

const PER_PAGE = 25;

@Injectable()
export class MemberService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(query: ListMembersQueryDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;

    const { data, total } = await this.userRepository.findAll({
      page,
      search: query.search,
      status: query.status,
      perPage: PER_PAGE,
    });

    return {
      data: data.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        photo_url: resolvePhotoUrl(u.photo_url),
        gender: u.gender,
        email: u.email,
        phone: u.phone ?? null,
        status: u.status,
        role: u.role,
      })),
      pagination: {
        page,
        per_page: PER_PAGE,
        total,
        total_pages: Math.ceil(total / PER_PAGE),
      },
    };
  }

  async update(
    id: string,
    dto: UpdateMemberDto,
    requesterId: string,
    requesterRole: string,
  ) {
    const user = await this.userRepository.findById(id);
    if (!user || user.status === 'inactive') throw new NotFoundException('Member not found');

    const canEditAny = ['admin', 'editor'].includes(requesterRole);
    const isOwn = requesterId === id;
    if (!canEditAny && !isOwn) {
      throw new ForbiddenException('You do not have permission to edit this profile');
    }

    const updateData: Record<string, unknown> = {
      full_name: dto.full_name,
      gender: dto.gender,
      phone: dto.phone,
      address: dto.address,
      hobbies: dto.hobbies,
      notes: dto.notes,
    };

    if (dto.birthdate) {
      const minAge = parseInt(process.env.MEMBER_MIN_AGE ?? '17', 10);
      const birthDate = new Date(dto.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < minAge) {
        throw new UnprocessableEntityException({
          message: 'Validation error',
          errors: { birthdate: `Member must be at least ${minAge} years old` },
        });
      }
      updateData.birthdate = new Date(dto.birthdate);
    }
    if (canEditAny && dto.status) updateData.status = dto.status;

    // Remove undefined fields
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    await this.userRepository.updateById(id, updateData as never);
    return { message: 'Member updated successfully' };
  }

  async updateRole(id: string, role: string, requesterId: string) {
    if (requesterId === id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    const user = await this.userRepository.findById(id);
    if (!user || user.status === 'inactive') throw new NotFoundException('Member not found');

    if (role === 'admin' && user.role !== 'admin') {
      const { data: allUsers } = await this.userRepository.findAll({ perPage: 999 });
      const adminCount = allUsers.filter((u) => u.role === 'admin').length;
      if (adminCount >= 4) {
        throw new BadRequestException('Maximum number of Admins (4) has been reached');
      }
    }

    await this.userRepository.updateById(id, { role } as never);
    return { message: 'Role updated successfully' };
  }

  async delete(id: string, requesterId: string, requesterRole: string) {
    if (requesterId === id) {
      throw new ForbiddenException('You cannot remove yourself');
    }
    if (!['admin', 'editor'].includes(requesterRole)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }
    const user = await this.userRepository.findById(id);
    if (!user || user.status === 'inactive') throw new NotFoundException('Member not found');
    await this.userRepository.updateById(id, { status: 'inactive' } as never);
    return { message: 'Member removed successfully' };
  }

  async updatePhoto(id: string, photoUrl: string) {
    await this.userRepository.updateById(id, { photo_url: photoUrl });
    return { message: 'Photo uploaded successfully', photo_url: resolvePhotoUrl(photoUrl) };
  }

  async getById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user || user.status === 'inactive') {
      throw new NotFoundException('Member not found');
    }

    return {
      id: user.id,
      full_name: user.full_name,
      photo_url: resolvePhotoUrl(user.photo_url),
      gender: user.gender ?? null,
      birthdate: user.birthdate ? user.birthdate.toISOString().split('T')[0] : null,
      email: user.email,
      phone: user.phone ?? null,
      address: user.address ?? null,
      join_date: user.join_date.toISOString().split('T')[0],
      status: user.status,
      hobbies: user.hobbies ?? [],
      notes: user.notes ?? null,
      role: user.role,
    };
  }
}

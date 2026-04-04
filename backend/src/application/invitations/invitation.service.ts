import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InvitationRepository } from '../../domain/repositories/invitation.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { AuthService } from '../auth/auth.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { RegisterViaInvitationDto } from './dto/register-via-invitation.dto';

@Injectable()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  async generate(
    dto: CreateInvitationDto,
    invitedBy: string,
    invitedByRole: string,
  ) {
    if (!['admin', 'editor'].includes(invitedByRole)) {
      throw new ForbiddenException('You do not have permission to generate invitation links');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.invitationRepository.create({
      token,
      email: dto.email,
      full_name: dto.full_name,
      invited_by: invitedBy,
      expires_at: expiresAt,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    return {
      invitation_link: `${frontendUrl}/register/${token}`,
      expires_at: expiresAt.toISOString(),
    };
  }

  async validate(token: string) {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      throw new BadRequestException('This invitation link is no longer valid');
    }
    if (invitation.used_at) {
      throw new BadRequestException('This invitation link is no longer valid');
    }
    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('This invitation link has expired');
    }

    return { valid: true, email: invitation.email, full_name: invitation.full_name };
  }

  async register(token: string, dto: RegisterViaInvitationDto) {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      throw new BadRequestException('This invitation link is no longer valid');
    }
    if (invitation.used_at) {
      throw new BadRequestException('This invitation link is no longer valid');
    }
    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('This invitation link has expired');
    }

    const existingUser = await this.userRepository.findByUsername(dto.username);
    if (existingUser) {
      throw new UnprocessableEntityException({
        message: 'Validation error',
        errors: { username: 'Username already taken' },
      });
    }

    const minAge = this.config.get<number>('MEMBER_MIN_AGE', 17);
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      full_name: dto.full_name,
      email: invitation.email,
      gender: dto.gender as 'male' | 'female',
      birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
      phone: dto.phone,
      address: dto.address,
      hobbies: dto.hobbies ?? [],
      notes: dto.notes,
      role: 'member',
      status: 'active',
      join_date: new Date(),
    });

    await this.invitationRepository.markUsed(token);

    const tokens = await this.authService.issueTokensPublic(user);
    return { message: 'Registration successful', ...tokens };
  }
}

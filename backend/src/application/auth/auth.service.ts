import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';

const resolvePhotoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
  return url.startsWith('/') ? `${backendUrl}${url}` : url;
};
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthUserDto } from './dto/auth-user.dto';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByUsername(dto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Your account is inactive');
    }

    return this.issueTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<LoginResponseDto> {
    const tokenHash = this.hashToken(dto.refresh_token);
    const stored = await this.refreshTokenRepository.findByToken(tokenHash);

    if (!stored || stored.revoked || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.revokeByToken(tokenHash);

    const user = await this.userRepository.findById(stored.user_id);
    if (!user || user.deleted_at || user.status === 'inactive') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string, dto: LogoutDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.refresh_token);
    await this.refreshTokenRepository.revokeByToken(tokenHash);
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUserDto(user);
  }

  async issueTokensPublic(user: User): Promise<LoginResponseDto> {
    return this.issueTokens(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateById(userId, { password: hashed } as never);
    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string): Promise<{ reset_url: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundException('No account found with that email');

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.updateById(user.id, {
      password_reset_token: token,
      password_reset_expires_at: expiresAt,
    } as never);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
    return { reset_url: `${frontendUrl}/reset-password/${token}` };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user || !user.password_reset_expires_at) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (new Date() > user.password_reset_expires_at) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateById(user.id, {
      password: hashed,
      password_reset_token: null,
      password_reset_expires_at: null,
    } as never);

    return { message: 'Password reset successfully' };
  }

  private async issueTokens(user: User): Promise<LoginResponseDto> {
    const expiresIn = this.config.get<number>('JWT_ACCESS_EXPIRATION', 3600);
    const refreshDays = this.config.get<number>('JWT_REFRESH_EXPIRATION_DAYS', 7);

    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(refreshDays));

    await this.refreshTokenRepository.create({
      token: tokenHash,
      user_id: user.id,
      expires_at: expiresAt,
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      token_type: 'Bearer',
      expires_in: Number(expiresIn),
      user: this.toAuthUserDto(user),
    };
  }

  private toAuthUserDto(user: User): AuthUserDto {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      photo_url: resolvePhotoUrl(user.photo_url),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

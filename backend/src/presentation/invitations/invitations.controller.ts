import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { InvitationService } from '../../application/invitations/invitation.service';
import { CreateInvitationDto } from '../../application/invitations/dto/create-invitation.dto';
import { RegisterViaInvitationDto } from '../../application/invitations/dto/register-via-invitation.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../infrastructure/auth/strategies/jwt.strategy';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  generate(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationService.generate(dto, user.userId, user.role);
  }

  @Get(':token/validate')
  validate(@Param('token') token: string) {
    return this.invitationService.validate(token);
  }

  @Post(':token/register')
  @HttpCode(201)
  register(
    @Param('token') token: string,
    @Body() dto: RegisterViaInvitationDto,
  ) {
    return this.invitationService.register(token, dto);
  }
}

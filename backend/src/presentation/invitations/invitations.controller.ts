import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InvitationService } from '../../application/invitations/invitation.service';
import { CreateInvitationDto } from '../../application/invitations/dto/create-invitation.dto';
import { RegisterViaInvitationDto } from '../../application/invitations/dto/register-via-invitation.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../infrastructure/auth/strategies/jwt.strategy';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate an invitation link (admin/editor only)' })
  @ApiResponse({ status: 201, description: 'Invitation created with invite_url', schema: { example: { invite_url: 'http://localhost:5173/register?token=...' } } })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  generate(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationService.generate(dto, user.userId, user.role);
  }

  @Get(':token/validate')
  @ApiOperation({ summary: 'Validate an invitation token' })
  @ApiParam({ name: 'token', description: 'Invitation token from the invite URL' })
  @ApiResponse({ status: 200, description: 'Token is valid, returns invitation details' })
  @ApiResponse({ status: 400, description: 'Token is expired or already used' })
  validate(@Param('token') token: string) {
    return this.invitationService.validate(token);
  }

  @Post(':token/register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new member via invitation token' })
  @ApiParam({ name: 'token', description: 'Invitation token from the invite URL' })
  @ApiResponse({ status: 201, description: 'Member registered successfully' })
  @ApiResponse({ status: 400, description: 'Token invalid/expired/used or username already taken' })
  register(
    @Param('token') token: string,
    @Body() dto: RegisterViaInvitationDto,
  ) {
    return this.invitationService.register(token, dto);
  }
}

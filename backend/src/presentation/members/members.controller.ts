import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MemberService } from '../../application/members/member.service';
import { ListMembersQueryDto } from '../../application/members/dto/list-members-query.dto';
import { UpdateMemberDto } from '../../application/members/dto/update-member.dto';
import { UpdateRoleDto } from '../../application/members/dto/update-role.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../infrastructure/auth/strategies/jwt.strategy';

const photoStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@ApiTags('Members')
@ApiBearerAuth()
@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @ApiOperation({ summary: 'List members with optional search and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  list(@Query() query: ListMembersQueryDto) {
    return this.memberService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single member by ID' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member profile' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  getById(@Param('id') id: string) {
    return this.memberService.getById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update member profile (self or admin/editor)' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Updated member profile' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.memberService.update(id, dto, user.userId, user.role);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a member permanently (admin/editor only)' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or self-deletion' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.memberService.delete(id, user.userId, user.role);
  }

  @Put(':id/role')
  @ApiOperation({ summary: 'Update a member\'s role (admin only, max 4 admins)' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Maximum admins reached' })
  @ApiResponse({ status: 403, description: 'Only admins can change roles' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Only admins can change roles');
    return this.memberService.updateRole(id, dto.role, user.userId);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload a profile photo (JPG/PNG, max 2MB)' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Photo uploaded, returns updated photo_url' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: photoStorage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
          return cb(new BadRequestException('Only JPG and PNG formats are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const photoUrl = `/uploads/${file.filename}`;
    return this.memberService.updatePhoto(id, photoUrl);
  }
}

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

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  list(@Query() query: ListMembersQueryDto) {
    return this.memberService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.memberService.getById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.memberService.update(id, dto, user.userId, user.role);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.memberService.delete(id, user.userId, user.role);
  }

  @Put(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Only admins can change roles');
    return this.memberService.updateRole(id, dto.role, user.userId);
  }

  @Post(':id/photo')
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

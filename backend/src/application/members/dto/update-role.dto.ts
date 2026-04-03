import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['admin', 'editor', 'member'] })
  @IsIn(['admin', 'editor', 'member'])
  role: string;
}

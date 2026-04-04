import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListMembersQueryDto {
  @ApiPropertyOptional({ example: '1' })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: 'john' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'pending'] })
  @IsIn(['active', 'pending'])
  @IsOptional()
  status?: string;
}

import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';

export class ListMembersQueryDto {
  @IsNumberString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['active', 'inactive', 'pending'])
  @IsOptional()
  status?: string;
}

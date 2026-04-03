import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsEnum(['male', 'female'])
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hobbies?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsIn(['active', 'inactive', 'pending'])
  @IsOptional()
  status?: string;
}

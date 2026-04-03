import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterViaInvitationDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(['male', 'female'])
  gender: string;

  @IsDateString()
  birthdate: string;

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
}

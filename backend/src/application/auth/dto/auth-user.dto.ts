import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ['admin', 'editor', 'member'] })
  role: string;

  @ApiProperty({ nullable: true })
  photo_url: string | null;
}

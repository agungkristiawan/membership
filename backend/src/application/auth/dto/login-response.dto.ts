import { AuthUserDto } from './auth-user.dto';

export class LoginResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUserDto;
}

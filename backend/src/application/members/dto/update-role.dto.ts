import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['admin', 'editor', 'member'])
  role: string;
}

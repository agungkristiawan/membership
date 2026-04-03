export type UserRole = 'admin' | 'editor' | 'member';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type Gender = 'male' | 'female';

export interface User {
  id: string;
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone?: string;
  gender?: Gender;
  birthdate?: Date;
  address?: string;
  join_date: Date;
  status: UserStatus;
  hobbies?: string[];
  notes?: string;
  photo_url?: string;
  role: UserRole;
  deleted_at?: Date | null;
  password_reset_token?: string | null;
  password_reset_expires_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

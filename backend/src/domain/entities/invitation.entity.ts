export interface Invitation {
  id: string;
  token: string;
  email: string;
  full_name: string;
  invited_by: string;
  expires_at: Date;
  used_at?: Date | null;
  created_at: Date;
}

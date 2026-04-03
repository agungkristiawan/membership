export interface RefreshToken {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}

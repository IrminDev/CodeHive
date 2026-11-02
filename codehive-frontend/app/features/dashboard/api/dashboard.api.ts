import { AuthService } from "~/features/auth/services/auth.service";

export const updatePassword = (currentPassword: string, newPassword: string) =>
  AuthService.updatePassword(currentPassword, newPassword);

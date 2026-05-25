import type { Role } from '@prisma/client';

export interface CurrentUserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}

import { ProjectMemberRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectMemberDto {
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;
}

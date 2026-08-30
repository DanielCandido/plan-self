import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectMemberRole } from '@prisma/client';

export class AddProjectMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}

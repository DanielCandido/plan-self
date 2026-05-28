import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberStatus, Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  workload?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  suspended?: boolean;
}

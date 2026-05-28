import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  emails!: string[];

  @ApiPropertyOptional({ enum: Role, default: Role.MEMBER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ minimum: 1, maximum: 30, default: 7 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}

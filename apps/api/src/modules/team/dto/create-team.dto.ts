import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TeamVisibility } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class CreateTeamDto {
  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ enum: TeamVisibility, default: TeamVisibility.PRIVATE })
  @IsOptional()
  @IsEnum(TeamVisibility)
  visibility?: TeamVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsCuid()
  ownerId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsCuid({ each: true })
  memberIds?: string[];
}

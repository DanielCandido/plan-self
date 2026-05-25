import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class CreateSprintMemberDto {
  @IsCuid()
  userId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  dailyCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  availabilityPercent?: number;
}

export class CreateSprintDto {
  @IsCuid()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetVelocity?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSprintMemberDto)
  members!: CreateSprintMemberDto[];
}

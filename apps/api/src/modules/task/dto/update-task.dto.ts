import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class ChecklistItemDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsBoolean()
  done!: boolean;
}

export class UpdateTaskRestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  position?: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  points?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsDateString()
  plannedStart?: string | null;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string | null;

  @IsOptional()
  @IsCuid()
  wbsNodeId?: string | null;

  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @IsOptional()
  @IsString()
  blockedReason?: string | null;

  @IsOptional()
  @IsCuid()
  boardColumnId?: string | null;

  @IsOptional()
  @IsCuid()
  sprintId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsCuid({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @IsOptional()
  @IsDateString()
  updatedAt?: string;
}

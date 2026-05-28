import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TaskState } from '@prisma/client';
import { IsCuid } from '@plan-self/utils';

export class CreateTaskDto {
  @IsCuid()
  projectId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsIn(Object.values(TaskState))
  status?: TaskState;

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
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  blocked?: boolean;

  @IsOptional()
  @IsString()
  blockedReason?: string;

  @IsOptional()
  @IsCuid()
  boardColumnId?: string;

  @IsOptional()
  @IsCuid()
  sprintId?: string;

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
}

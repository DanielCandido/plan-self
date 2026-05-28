import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TaskState } from '@prisma/client';
import { IsCuid } from '@plan-self/utils';

export class TaskQueryDto {
  @IsCuid()
  projectId!: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(Object.values(TaskState))
  status?: TaskState;

  @IsOptional()
  @IsCuid()
  sprintId?: string;

  @IsOptional()
  @IsCuid()
  boardColumnId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(500)
  limit = 100;
}

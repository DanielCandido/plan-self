import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class MoveBoardTaskDto {
  @IsCuid()
  projectId!: string;

  @IsCuid()
  taskId!: string;

  @IsCuid()
  targetColumnId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetPosition?: number;
}

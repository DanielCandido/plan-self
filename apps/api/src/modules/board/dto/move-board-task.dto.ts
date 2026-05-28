import { Type } from 'class-transformer';
import { IsCuid, IsInt, IsOptional, Min } from 'class-validator';

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

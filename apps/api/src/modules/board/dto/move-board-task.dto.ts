import { Type } from 'class-transformer';
import {IsInt, IsOptional, IsString, Min} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class MoveBoardTaskDto {
  @IsString()
  projectId!: string;

  @IsString()
  taskId!: string;

  @IsString()
  targetColumnId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetPosition?: number;
}

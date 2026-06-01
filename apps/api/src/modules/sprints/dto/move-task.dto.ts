import {IsArray, IsInt, IsOptional, IsString, Min} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class MoveTaskDto {
  @IsString()
  projectId!: string;

  @IsArray()
  taskIds!: string[];

  @IsOptional()
  @IsString()
  targetSprintId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetIndex?: number;
}

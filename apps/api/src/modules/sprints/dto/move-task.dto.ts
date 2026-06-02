import {IsArray, IsInt, IsOptional, Min} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class MoveTaskDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  @IsCuid()
  taskIds!: string[];

  @IsOptional()
  @IsCuid()
  targetSprintId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetIndex?: number;
}

import {IsArray, IsInt, IsOptional, IsString, Min} from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class MoveTaskDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  taskIds!: string[];

  @IsOptional()
  @IsCuid()
  targetSprintId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetIndex?: number;
}

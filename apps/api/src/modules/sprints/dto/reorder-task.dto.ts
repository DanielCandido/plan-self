import { IsArray, IsOptional } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class ReorderTaskDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  orderedTaskIds!: string[];

  @IsOptional()
  @IsCuid()
  sprintId?: string | null;
}

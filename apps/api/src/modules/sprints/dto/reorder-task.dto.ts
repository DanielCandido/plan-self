import { IsArray, IsOptional } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class ReorderTaskDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  @IsCuid({ each: true })
  orderedTaskIds!: string[];

  @IsOptional()
  @IsCuid()
  sprintId?: string | null;
}

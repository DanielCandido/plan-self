import { IsArray, IsOptional, IsUUID } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class ReorderTaskDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  @IsCuid()
  orderedTaskIds!: string[];

  @IsOptional()
  @IsCuid()
  sprintId?: string | null;
}

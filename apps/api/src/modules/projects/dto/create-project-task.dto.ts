import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class CreateProjectTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  storyPoints?: number;

  @IsOptional()
  @IsString()
  dueAt?: string;

  @IsOptional()
  @IsArray()
  @IsCuid({ each: true })
  assigneeIds?: string[];
}

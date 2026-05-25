import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  storyPoints?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelNames?: string[];

  @IsOptional()
  @IsArray()
  @IsCuid()
  assigneeIds?: string[];

  @IsOptional()
  @IsString()
  blockedReason?: string | null;
}

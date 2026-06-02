import {IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min} from 'class-validator';
import {IsCuid} from "@plan-self/utils";
import {TaskState} from "@prisma/client";

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
  @IsCuid({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsString()
  blockedReason?: string | null;

  @IsOptional()
  @IsEnum(TaskState)
  status?: TaskState;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

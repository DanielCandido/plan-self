import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class BacklogQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '0'), 10))
  @IsInt()
  @Min(0)
  page = 0;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '20'), 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsOptional()
  @IsString()
  search = '';

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsCuid()
  epicId?: string;

  @IsOptional()
  @IsCuid()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['sortOrder', 'priority', 'storyPoints', 'updatedAt', 'title'])
  sortBy = 'sortOrder';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'asc';
}

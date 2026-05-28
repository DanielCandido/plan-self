import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class KanbanBacklogQueryDto {
  @IsCuid()
  projectId!: string;

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
  @IsIn(['sortOrder', 'priority', 'title', 'storyPoints', 'updatedAt'])
  sortBy = 'sortOrder';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  page = 0;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 24;
}

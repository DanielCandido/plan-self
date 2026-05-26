import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListProjectTasksQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '0'), 10))
  @IsInt()
  @Min(0)
  page = 0;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '20'), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;

  @IsOptional()
  @IsString()
  q = '';

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}

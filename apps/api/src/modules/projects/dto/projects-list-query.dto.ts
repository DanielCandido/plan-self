import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListProjectsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '0'), 10))
  @IsInt()
  @Min(0)
  page = 0;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '12'), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 12;

  @IsOptional()
  @IsString()
  q = '';

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';
}

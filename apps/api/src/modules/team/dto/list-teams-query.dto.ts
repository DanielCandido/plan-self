import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListTeamsQueryDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '0'), 10))
  @IsInt()
  @Min(0)
  page = 0;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '12'), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 12;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q = '';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archived = false;

  @ApiPropertyOptional({ default: 'updatedAt' })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy: 'name' | 'createdAt' | 'updatedAt' = 'updatedAt';

  @ApiPropertyOptional({ default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListProjectOptionsQueryDto {
  @IsOptional()
  @IsString()
  q = '';

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value ?? '25'), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}

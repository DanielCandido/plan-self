import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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
  @IsUUID('4', { each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsString()
  blockedReason?: string | null;
}

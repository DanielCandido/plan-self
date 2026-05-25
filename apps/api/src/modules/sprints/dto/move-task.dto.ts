import { IsArray, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveTaskDto {
  @IsUUID()
  projectId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  taskIds!: string[];

  @IsOptional()
  @IsUUID()
  targetSprintId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  targetIndex?: number;
}

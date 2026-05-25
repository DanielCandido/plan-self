import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderTaskDto {
  @IsUUID()
  projectId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  orderedTaskIds!: string[];

  @IsOptional()
  @IsUUID()
  sprintId?: string | null;
}

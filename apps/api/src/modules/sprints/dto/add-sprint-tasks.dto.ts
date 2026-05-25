import { IsArray, IsUUID } from 'class-validator';

export class AddSprintTasksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds!: string[];
}

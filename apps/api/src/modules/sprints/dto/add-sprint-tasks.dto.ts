import { IsArray } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class AddSprintTasksDto {
  @IsArray()
  @IsCuid()
  taskIds!: string[];
}

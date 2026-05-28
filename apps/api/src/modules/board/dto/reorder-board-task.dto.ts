import { IsArray } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class ReorderBoardTaskDto {
  @IsCuid()
  projectId!: string;

  @IsCuid()
  columnId!: string;

  @IsArray()
  @IsCuid({ each: true })
  orderedTaskIds!: string[];
}

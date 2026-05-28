import { IsArray, IsCuid } from 'class-validator';

export class ReorderBoardTaskDto {
  @IsCuid()
  projectId!: string;

  @IsCuid()
  columnId!: string;

  @IsArray()
  @IsCuid({ each: true })
  orderedTaskIds!: string[];
}

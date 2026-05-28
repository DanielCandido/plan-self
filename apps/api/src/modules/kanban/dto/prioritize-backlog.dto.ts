import { IsArray } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class PrioritizeBacklogDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  @IsCuid({ each: true })
  orderedTaskIds!: string[];
}

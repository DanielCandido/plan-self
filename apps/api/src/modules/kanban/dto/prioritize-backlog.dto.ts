import { IsArray, IsCuid } from 'class-validator';

export class PrioritizeBacklogDto {
  @IsCuid()
  projectId!: string;

  @IsArray()
  @IsCuid({ each: true })
  orderedTaskIds!: string[];
}

import { IsOptional } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class CurrentSprintQueryDto {
  @IsOptional()
  @IsCuid()
  projectId?: string;
}

import { IsArray, IsOptional, IsString } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class CompleteSprintDto {
  @IsOptional()
  @IsArray()
  @IsCuid({ each: true })
  carryOverTaskIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

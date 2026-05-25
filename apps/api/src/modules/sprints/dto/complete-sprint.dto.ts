import { IsArray, IsOptional, IsString } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class CompleteSprintDto {
  @IsOptional()
  @IsArray()
  @IsCuid()
  carryOverTaskIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

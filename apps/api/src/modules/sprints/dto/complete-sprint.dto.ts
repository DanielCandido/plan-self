import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CompleteSprintDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  carryOverTaskIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

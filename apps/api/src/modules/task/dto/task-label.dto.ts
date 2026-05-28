import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class LabelQueryDto {
  @IsCuid()
  projectId!: string;
}

export class CreateLabelDto {
  @IsCuid()
  projectId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}

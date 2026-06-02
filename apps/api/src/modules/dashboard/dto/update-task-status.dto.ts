import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsCuid } from '@plan-self/utils';

export class UpdateTaskStatusDto {
  @ApiProperty()
  @IsString()
  @IsCuid()
  boardColumnId!: string;
}

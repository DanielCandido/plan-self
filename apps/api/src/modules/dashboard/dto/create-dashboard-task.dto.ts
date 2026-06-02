import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import {IsCuid} from "@plan-self/utils";

export class CreateDashboardTaskDto {
  @ApiProperty()
  @IsString()
  @MaxLength(180)
  title!: string;

  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsCuid({ each: true })
  assigneeIds?: string[];
}

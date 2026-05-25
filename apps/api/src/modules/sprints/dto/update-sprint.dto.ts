import { PartialType } from '@nestjs/swagger';
import { CreateSprintDto, CreateSprintMemberDto } from './create-sprint.dto';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SprintStatus } from '@prisma/client';

export class UpdateSprintDto extends PartialType(CreateSprintDto) {
  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSprintMemberDto)
  members?: CreateSprintMemberDto[];
}

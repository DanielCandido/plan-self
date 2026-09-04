import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ConstructionProjectDto } from './construction-project.dto';
import { ProjectProfile } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(ProjectProfile)
  profile?: ProjectProfile;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConstructionProjectDto)
  construction?: ConstructionProjectDto;
}

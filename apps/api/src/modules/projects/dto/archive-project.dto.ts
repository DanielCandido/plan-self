import { IsBoolean } from 'class-validator';

export class ArchiveProjectDto {
  @IsBoolean()
  archive!: boolean;
}

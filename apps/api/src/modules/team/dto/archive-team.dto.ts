import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ArchiveTeamDto {
  @ApiProperty()
  @IsBoolean()
  archive!: boolean;
}

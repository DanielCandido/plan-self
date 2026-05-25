import { TaskState } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskState })
  @IsEnum(TaskState)
  status!: TaskState;
}

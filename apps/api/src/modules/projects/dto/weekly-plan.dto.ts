import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWeeklyPlanDto {
  @IsDateString() weekStart!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CreateWeeklyPlanItemDto {
  @IsOptional() @IsString() wbsNodeId?: string;
  @IsOptional() @IsString() taskId?: string;
  @IsString() @MaxLength(240) description!: string;
  @IsOptional() @IsString() @MaxLength(20) unit?: string;
  @IsNumber() @Min(0) plannedQuantity!: number;
  @IsOptional() @IsString() @MaxLength(1000) constraintNote?: string;
}

export class UpdateWeeklyPlanItemDto {
  @IsOptional() @IsNumber() @Min(0) actualQuantity?: number;
  @IsOptional() @IsNumber() @Min(0) plannedQuantity?: number;
  @IsOptional() @IsIn(['PLANNED', 'IN_PROGRESS', 'DONE', 'BLOCKED']) status?: string;
  @IsOptional() @IsString() @MaxLength(1000) constraintNote?: string;
}

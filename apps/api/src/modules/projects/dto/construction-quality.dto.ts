import { IsArray, IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInspectionDto {
  @IsString() @MaxLength(180) title!: string;
  @IsIn(['QUALITY', 'SAFETY']) type!: string;
  @IsDateString() inspectionDate!: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsArray() checklist!: unknown[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsIn(['OPEN', 'APPROVED', 'REJECTED']) status?: string;
}

export class CreateNonConformityDto {
  @IsOptional() @IsString() inspectionId?: string;
  @IsString() @MaxLength(40) code!: string;
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(5000) description!: string;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) severity?: string;
  @IsOptional() @IsString() responsibleId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}

export class UpdateNonConformityDto {
  @IsOptional() @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) status?: string;
  @IsOptional() @IsString() responsibleId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(5000) resolution?: string;
}

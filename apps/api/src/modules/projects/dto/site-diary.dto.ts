import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveSiteDiaryDto {
  @IsDateString() reportDate!: string;
  @IsOptional() @IsString() @MaxLength(80) weather?: string;
  @IsOptional() @IsNumber() temperature?: number;
  @IsArray() workforce!: unknown[];
  @IsArray() equipment!: unknown[];
  @IsArray() services!: unknown[];
  @IsArray() occurrences!: unknown[];
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsIn(['DRAFT', 'CLOSED']) status?: string;
}

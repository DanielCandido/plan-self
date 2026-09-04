import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConstructionProjectDto {
  @IsOptional() @IsString() @MaxLength(160) siteName?: string;
  @IsOptional() @IsString() @MaxLength(240) address?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(2) state?: string;
  @IsOptional() @IsString() @MaxLength(12) postalCode?: string;
  @IsOptional() @IsString() @MaxLength(160) clientName?: string;
  @IsOptional() @IsString() @MaxLength(32) clientDocument?: string;
  @IsOptional() @IsString() @MaxLength(160) technicalManagerName?: string;
  @IsOptional() @IsString() @MaxLength(40) technicalManagerRegistry?: string;
  @IsOptional() @IsString() @MaxLength(60) artNumber?: string;
  @IsOptional() @IsString() @MaxLength(60) permitNumber?: string;
  @IsOptional() @IsString() @MaxLength(60) contractNumber?: string;
  @IsOptional() @IsDateString() plannedStart?: string;
  @IsOptional() @IsDateString() plannedEnd?: string;
}

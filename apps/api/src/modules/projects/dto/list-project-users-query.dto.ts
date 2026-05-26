import { IsOptional, IsString } from 'class-validator';

export class ListProjectUsersQueryDto {
  @IsOptional()
  @IsString()
  q = '';
}

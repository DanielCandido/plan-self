import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty({ minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12, { message: 'A senha deve ter pelo menos 12 caracteres' })
  @MaxLength(128, { message: 'A senha deve ter no maximo 128 caracteres' })
  @Matches(/[a-z]/, { message: 'A senha deve conter uma letra minuscula' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter uma letra maiuscula' })
  @Matches(/[0-9]/, { message: 'A senha deve conter um numero' })
  newPassword!: string;
}

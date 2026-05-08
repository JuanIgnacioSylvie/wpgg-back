import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

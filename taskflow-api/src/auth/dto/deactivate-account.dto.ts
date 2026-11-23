import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeactivateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}

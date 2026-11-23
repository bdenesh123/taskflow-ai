import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(['active', 'on_hold', 'completed'])
  status?: 'active' | 'on_hold' | 'completed';

  @IsOptional()
  @IsDateString()
  due_date?: string | null;
}

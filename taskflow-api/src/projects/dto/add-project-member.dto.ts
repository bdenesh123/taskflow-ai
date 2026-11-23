import { IsString, Matches } from 'class-validator';

export class AddProjectMemberDto {
  @IsString()
  @Matches(/^\d+$/, {
    message: 'user_id must contain only digits',
  })
  user_id!: string;
}

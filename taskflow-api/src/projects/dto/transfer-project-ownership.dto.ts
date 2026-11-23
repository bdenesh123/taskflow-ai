import { IsNotEmpty, IsString } from 'class-validator';

export class TransferProjectOwnershipDto {
  @IsString()
  @IsNotEmpty()
  new_owner_id: string;
}

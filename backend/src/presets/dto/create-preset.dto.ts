import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePresetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}


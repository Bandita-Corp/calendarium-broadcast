import {
  IsString,
  IsDateString,
  IsOptional,
  IsHexColor,
  MaxLength,
  IsArray,
} from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  presetId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  noteType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  noteContent?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

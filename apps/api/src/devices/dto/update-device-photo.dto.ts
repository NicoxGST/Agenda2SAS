import { IsOptional, IsString } from 'class-validator';

export class UpdateDevicePhotoDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

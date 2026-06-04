import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateDevicePhotoDto {
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

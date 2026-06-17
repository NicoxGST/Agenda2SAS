import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDevicePhotoDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

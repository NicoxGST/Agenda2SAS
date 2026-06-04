import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceDto {
  @IsOptional()
  @IsInt()
  clientId?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

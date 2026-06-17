import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AttendReservationDto {
  @IsOptional()
  @IsInt()
  deviceId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  brand?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deviceType?: string;

  @IsOptional()
  @IsString()
  deviceDescription?: string;

  @IsString()
  @IsNotEmpty()
  problemDescription!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  laborCost?: number;
}

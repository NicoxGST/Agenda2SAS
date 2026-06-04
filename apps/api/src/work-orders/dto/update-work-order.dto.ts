import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsInt()
  deviceId?: number;

  @IsOptional()
  @IsInt()
  workerId?: number;

  @IsOptional()
  @IsInt()
  reservationId?: number;

  @IsOptional()
  @IsString()
  problemDescription?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  laborCost?: number;
}

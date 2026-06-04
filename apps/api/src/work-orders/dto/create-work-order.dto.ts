import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkOrderDto {
  @IsInt()
  deviceId!: number;

  @IsOptional()
  @IsInt()
  workerId?: number;

  @IsOptional()
  @IsInt()
  reservationId?: number;

  @IsString()
  @IsNotEmpty()
  problemDescription!: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  laborCost?: number;
}

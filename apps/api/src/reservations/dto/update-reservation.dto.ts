import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class UpdateReservationDto {
  @IsOptional()
  @IsInt()
  workerId?: number;

  @IsOptional()
  @IsInt()
  serviceId?: number;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmount?: number;
}

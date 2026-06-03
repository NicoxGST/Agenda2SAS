import { IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  workerId!: number;

  @IsInt()
  serviceId!: number;

  @IsISO8601()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  contactPhone!: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  depositAmount?: number;
}

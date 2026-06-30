import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsInt()
  workerId!: number;

  @IsInt()
  serviceId!: number;

  @IsString()
  @IsNotEmpty()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  contactPhone!: string;

  @IsOptional()
  @IsString()
  clientNotes?: string;
}

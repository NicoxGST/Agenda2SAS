import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateWorkerAvailabilityDto {
  @IsInt()
  workerId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  slotMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

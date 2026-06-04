import { IsInt, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class AvailableSlotsQueryDto {
  @Type(() => Number)
  @IsInt()
  workerId!: number;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;
}

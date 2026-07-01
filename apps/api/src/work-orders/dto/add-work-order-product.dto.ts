import { IsInt, Min } from 'class-validator';

export class AddWorkOrderProductDto {
  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}
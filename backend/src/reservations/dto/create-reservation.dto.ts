import { IsDateString, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  spaceId: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}

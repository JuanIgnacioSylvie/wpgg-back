import { IsIn, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ALLOWED_RIOT_REGIONS } from '../../application/riot-regions';

export class LinkRiotAccountRequestDto {
  @IsString()
  @Length(1, 16)
  gameName: string;

  @IsString()
  @Length(3, 5)
  tagLine: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsString()
  @IsIn([...ALLOWED_RIOT_REGIONS])
  region: string;
}

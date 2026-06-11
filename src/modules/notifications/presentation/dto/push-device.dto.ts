import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RegisterPushDeviceDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsIn(['web', 'android', 'ios'])
  platform: 'web' | 'android' | 'ios';
}

export class UnregisterPushDeviceDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

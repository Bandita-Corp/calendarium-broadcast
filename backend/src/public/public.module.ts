import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PeriodsModule } from '../periods/periods.module';
import { PresetsModule } from '../presets/presets.module';

@Module({
  imports: [PeriodsModule, PresetsModule],
  controllers: [PublicController],
})
export class PublicModule {}

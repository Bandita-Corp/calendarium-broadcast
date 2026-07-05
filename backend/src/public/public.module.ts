import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [PeriodsModule],
  controllers: [PublicController],
})
export class PublicModule {}

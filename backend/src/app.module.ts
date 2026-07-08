import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PeriodsModule } from './periods/periods.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { PresetsModule } from './presets/presets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PeriodsModule,
    PublicModule,
    AdminModule,
    PresetsModule,
  ],
})
export class AppModule {}

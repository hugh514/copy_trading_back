import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RiskModule } from './modules/risk/risk.module';
import { KeyModule } from './modules/keys/keys.module';
import { DownloadModule } from './modules/download/download.module';
import { EAModule } from './modules/ea/ea.module';
import { EventsModule } from './modules/events/events.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    RiskModule,
    KeyModule,
    DownloadModule,
    EAModule,
    EventsModule,
  ],
})
export class AppModule {}

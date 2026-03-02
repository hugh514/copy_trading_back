import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../modules/events/events.module';

@Module({
  imports: [PrismaModule, AuthModule, EventsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}

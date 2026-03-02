import { Module } from '@nestjs/common';
import { RobotController } from './ea.controller';
import { RobotKeyGuard } from './guards/robot-key.guard';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [RobotController],
  providers: [RobotKeyGuard],
})
export class EAModule {}

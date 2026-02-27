import { Module } from '@nestjs/common';
import { RobotController } from './ea.controller';
import { RobotKeyGuard } from './guards/robot-key.guard';

@Module({
  controllers: [RobotController],
  providers: [RobotKeyGuard],
})
export class EAModule {}

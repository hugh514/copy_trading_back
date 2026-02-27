import { Module } from '@nestjs/common';
import { KeyController } from './keys.controller';

@Module({
  controllers: [KeyController],
})
export class KeyModule {}

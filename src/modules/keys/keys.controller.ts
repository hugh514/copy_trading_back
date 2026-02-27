import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Access Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class KeyController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('rotate')
  @ApiOperation({ summary: 'Gera ou rotaciona a chave de acesso do usuário' })
  @ApiResponse({ status: 201, description: 'Chave gerada com sucesso' })
  async rotateKey(@Request() req) {
    const userId = req.user.id;
    const newKey = `CT-${uuidv4()}`;

    return this.prisma.accessKey.upsert({
      where: { userId },
      update: {
        key: newKey,
        lastGeneratedAt: new Date(),
        isEnabled: true,
      },
      create: {
        userId,
        key: newKey,
      },
    });
  }
}

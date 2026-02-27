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

@ApiTags('Chaves de Acesso')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('keys')
export class KeyController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('rotate')
  @ApiOperation({
    summary: 'Rotacionar Chave',
    description:
      'Gera uma nova chave de acesso API para o robô (EA) e desativa a anterior.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nova chave gerada com sucesso.',
    schema: {
      example: {
        id: 'uuid',
        key: 'CT-7f3b-4a21-9d8e...',
        isEnabled: true,
        lastGeneratedAt: '2024-02-27T16:00:00Z',
      },
    },
  })
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

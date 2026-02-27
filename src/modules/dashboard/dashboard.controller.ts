import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da Conta',
    description:
      'Retorna o saldo, equidade e estatísticas de lucro do usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo retornado com sucesso.',
    schema: {
      example: {
        id: 'uuid',
        userId: 'uuid',
        balance: 10500.5,
        equity: 10450.2,
        dailyProfit: 15.5,
        winRate: 65.5,
        lastSyncAt: '2024-02-27T16:00:00Z',
      },
    },
  })
  async getSummary(@Request() req) {
    const userId = req.user.id;
    let summary = await this.prisma.tradeAccount.findUnique({
      where: { userId },
    });

    if (!summary) {
      summary = await this.prisma.tradeAccount.create({
        data: { userId },
      });
    }

    return summary;
  }

  @Get('positions')
  @ApiOperation({
    summary: 'Posições Abertas',
    description:
      'Retorna a lista de todas as operações atualmente abertas no MetaTrader.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de posições retornada com sucesso.',
    schema: {
      example: [
        {
          id: 'uuid',
          ticket: 123456,
          symbol: 'EURUSD',
          type: 'BUY',
          volume: 0.1,
          openPrice: 1.085,
          currentProfit: 5.2,
        },
      ],
    },
  })
  async getPositions(@Request() req) {
    const userId = req.user.id;
    return this.prisma.openPosition.findMany({
      where: { userId },
    });
  }
}

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
  @ApiOperation({ summary: 'Retorna o resumo da conta de trade do usuário' })
  @ApiResponse({ status: 200, description: 'Resumo retornado com sucesso' })
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
  @ApiOperation({ summary: 'Retorna as posições abertas do usuário' })
  @ApiResponse({ status: 200, description: 'Posições retornadas com sucesso' })
  async getPositions(@Request() req) {
    const userId = req.user.id;
    return this.prisma.openPosition.findMany({
      where: { userId },
    });
  }
}

import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateRiskSettingsDto } from './risk.schema';

@ApiTags('Risk Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('risk')
export class RiskController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Retorna as configurações de risco do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Configurações retornadas com sucesso',
  })
  async getSettings(@Request() req) {
    const userId = req.user.id;
    let settings = await this.prisma.riskSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.riskSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  @Put('settings')
  @ApiOperation({ summary: 'Atualiza as configurações de risco do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
  })
  async updateSettings(@Request() req, @Body() data: UpdateRiskSettingsDto) {
    const userId = req.user.id;
    return this.prisma.riskSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }
}

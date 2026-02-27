import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Sistema')
@Controller('system')
export class DownloadController {
  @Get('download-url')
  @ApiOperation({
    summary: 'URL do Robô',
    description:
      'Retorna o link direto para download do arquivo executável do robô (EA) para MetaTrader.',
  })
  @ApiResponse({
    status: 200,
    description: 'URL retornada com sucesso.',
    schema: {
      example: {
        url: 'https://storage.copytrade.com/ea/RobotTrade.ex5',
      },
    },
  })
  async getDownloadUrl() {
    return {
      url: 'https://link-para-s3-ou-arquivo-local.ex5',
    };
  }
}

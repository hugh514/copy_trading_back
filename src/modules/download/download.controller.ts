import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller('system')
export class DownloadController {
  @Get('download-url')
  @ApiOperation({ summary: 'Retorna a URL de download do robô (EA)' })
  @ApiResponse({ status: 200, description: 'URL retornada com sucesso' })
  async getDownloadUrl() {
    return {
      url: 'https://link-para-s3-ou-arquivo-local.ex5',
    };
  }
}

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Autenticação')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login do Usuário',
    description: 'Autentica o usuário e retorna o token JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login bem sucedido com Access Token.',
    schema: {
      example: {
        success: true,
        data: {
          access_token: 'eyJhbGciOiJIUzI1Ni...',
          refresh_token: 'uuid-refresh-token',
          user: {
            id: 'uuid-123',
            name: 'Carlos Trader',
            email: 'carlos@exemplo.com',
            role: 'CLIENT',
            isActive: true,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout do Usuário',
    description: 'Invalida o token atual adicionando-o à blacklist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso.',
    schema: {
      example: {
        success: true,
        message: 'Logout realizado com sucesso. O token foi invalidado.',
        timestamp: '2024-03-20T10:00:00Z',
      },
    },
  })
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar Token',
    description:
      'Utiliza um refresh token válido para gerar um novo access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          access_token: 'new-jwt-token',
          refresh_token: 'new-uuid-refresh-token',
          user: { id: 'uuid-123', email: 'carlos@exemplo.com', role: 'CLIENT' },
        },
      },
    },
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dados do Usuário Autenticado',
    description:
      'Retorna o perfil completo do usuário logado (Relacionamentos incluídos).',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados retornados com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-123',
          name: 'Carlos Trader',
          email: 'carlos@exemplo.com',
          role: 'CLIENT',
          isActive: true,
          accountProfile: {
            language: 'pt-BR',
            theme: 'dark',
            timezone: 'America/Sao_Paulo',
          },
          riskSettings: {
            multiplier: 1.5,
            dailyLossLimit: 200.0,
            isActive: true,
          },
          tradeAccount: {
            balance: 1500.5,
            equity: 1520.0,
          },
        },
      },
    },
  })
  async getMe(@Request() req) {
    // req.user já vem populado pelo JwtStrategy
    return {
      success: true,
      data: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recuperar Senha',
    description: 'Envia instruções para recuperação de senha.',
  })
  @ApiResponse({
    status: 200,
    description: 'Instruções enviadas.',
    schema: {
      example: {
        success: true,
        message: 'Se o e-mail existir, as instruções foram enviadas.',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}

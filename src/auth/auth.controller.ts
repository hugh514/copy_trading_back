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
          user: {
            id: 'uuid',
            name: 'João Silva',
            email: 'admin@copytrade.com',
            role: 'CLIENT',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastro de Usuário (Admin Only)',
    description:
      'Registra um novo usuário com role CLIENT e gera dados iniciais. Apenas para administradores.',
  })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou e-mail já existente.',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar Token',
    description:
      'Utiliza um refresh token válido para gerar um novo access token e um novo refresh token, invalidando o anterior.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          access_token: 'new-jwt-token',
          refresh_token: 'new-uuid-token',
          user: { id: 'uuid', email: '...', role: 'CLIENT' },
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
    description: 'Retorna o perfil completo do usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados retornados com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'CLIENT',
          accountProfile: {
            language: 'pt-BR',
            theme: 'light',
            timezone: 'America/Sao_Paulo',
          },
          riskSettings: {
            multiplier: 1.0,
            dailyLossLimit: 150.0,
            isActive: true,
          },
          tradeAccount: { balance: 0.0 },
        },
      },
    },
  })
  async getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recuperar Senha',
    description: 'Envia instruções para recuperação de senha (simulado).',
  })
  @ApiResponse({ status: 200, description: 'Instruções enviadas.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }
}

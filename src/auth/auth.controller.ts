import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ForgotPasswordDto } from './dto/auth.dto';

@ApiTags('Autenticação')
@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login do Usuário', description: 'Autentica o usuário e retorna o token JWT.' })
    @ApiResponse({ status: 200, description: 'Login bem sucedido com Access Token.' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Cadastro de Usuário', description: 'Registra um novo usuário com role CLIENT.' })
    @ApiResponse({ status: 201, description: 'Usuário cadastrado com sucesso.' })
    @ApiResponse({ status: 400, description: 'Dados inválidos ou e-mail já existente.' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Recuperar Senha', description: 'Envia instruções para recuperação de senha (simulado).' })
    @ApiResponse({ status: 200, description: 'Instruções enviadas.' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
}

import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, ForgotPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            success: true,
            data: {
                access_token: this.jwtService.sign(payload),
                user
            },
            timestamp: new Date().toISOString()
        };
    }

    async register(registerDto: RegisterDto) {
        const exists = await this.prisma.user.findUnique({ where: { email: registerDto.email } });
        if (exists) {
            throw new BadRequestException('E-mail já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                email: registerDto.email,
                password: hashedPassword,
                role: 'CLIENT',
            }
        });

        const { password, ...result } = user;
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: forgotPasswordDto.email } });

        // Regra Anti-Overengineering: simular envio
        if (user) {
            const fakeToken = require('crypto').randomUUID();
            console.log(`[SIMULAÇÃO DE EMAIL] Instruções enviadas para ${user.email}. Token de reset: ${fakeToken}`);
        }

        return {
            success: true,
            message: 'Se o e-mail existir, as instruções foram enviadas.',
            timestamp: new Date().toISOString()
        };
    }
}

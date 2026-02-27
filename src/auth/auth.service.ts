import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto, ForgotPasswordDto } from './dto/auth.dto';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        accountProfile: true,
        riskSettings: true,
        tradeAccount: true,
      },
    });
    if (user && (await bcrypt.compare(pass, user.password))) {
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

    return this.generateTokens(user.id, user);
  }

  private async generateTokens(userId: string, user: any) {

    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);


    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async refreshToken(refreshTokenDto: any) {
    const { refreshToken } = refreshTokenDto;

    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            accountProfile: true,
            riskSettings: true,
            tradeAccount: true,
          },
        },
      },
    });

    if (!tokenData || tokenData.isRevoked || tokenData.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const { user } = tokenData;
    const { password, ...userWithoutPassword } = user as any;

    return this.generateTokens(user.id, userWithoutPassword);
  }

  async register(registerDto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (exists) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // nested write to ensure all defaults are created
    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: 'CLIENT',
        accountProfile: {
          create: {
            language: 'pt-BR',
            theme: 'light',
            timezone: 'America/Sao_Paulo',
          },
        },
        riskSettings: {
          create: {
            multiplier: 1.0,
            dailyLossLimit: 150.0,
            isActive: true,
          },
        },
        tradeAccount: {
          create: {
            balance: 0.0,
          },
        },
        accessKey: {
          create: {
            key: `CT-${uuidv4()}`,
          },
        },
      },
      include: {
        accountProfile: true,
        riskSettings: true,
        tradeAccount: true,
      },
    });

    return this.generateTokens(user.id, user); 
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        accountProfile: true,
        riskSettings: true,
        tradeAccount: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { password, ...result } = user;
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    // Regra Anti-Overengineering: simular envio
    if (user) {
      const fakeToken = require('crypto').randomUUID();
      console.log(
        `[SIMULAÇÃO DE EMAIL] Instruções enviadas para ${user.email}. Token de reset: ${fakeToken}`,
      );
    }

    return {
      success: true,
      message: 'Se o e-mail existir, as instruções foram enviadas.',
      timestamp: new Date().toISOString(),
    };
  }
}

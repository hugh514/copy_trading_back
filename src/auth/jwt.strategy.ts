import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);


    if (token) {
      const isBlacklisted = await this.prisma.blacklistedToken.findUnique({
        where: { token },
      });
      if (isBlacklisted) {
        throw new UnauthorizedException(
          'Token invalidado. Faça login novamente.',
        );
      }
    }

    // 2. Buscar o usuário completo com relacionamentos
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        accountProfile: true,
        riskSettings: true,
        tradeAccount: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    // 3. Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new ForbiddenException(
        'A sua conta foi desativada pelo administrador.',
      );
    }

    const { password, ...result } = user;
    return result;
  }
}

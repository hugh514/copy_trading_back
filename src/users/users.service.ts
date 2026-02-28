import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserStatusDto,
  AdminUpdateUserDto,
  UserViewModel,
} from './dto/users.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number = 0, take: number = 10) {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        include: {
          openPositions: true,
          tradeAccount: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    const formattedUsers: UserViewModel[] = users.map((user) => {
      const activeCurrencies = Array.from(
        new Set(user.openPositions.map((p) => p.symbol)),
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        activeCurrencies,
        balance: user.tradeAccount?.balance || 0,
      };
    });

    return {
      success: true,
      data: {
        users: formattedUsers,
        meta: {
          total,
          skip,
          take,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async create(data: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new BadRequestException('E-mail já cadastrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
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
      });
    });

    const { password, ...result } = user;
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  async updateStatus(userId: string, data: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: data.isActive },
    });

    // Se desativar, revoga todos os tokens
    if (!data.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return {
      success: true,
      message: `Status do usuário atualizado para ${data.isActive ? 'ativo' : 'inativo'}`,
      timestamp: new Date().toISOString(),
    };
  }

  async updateAdmin(userId: string, data: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (exists) throw new BadRequestException('E-mail já está em uso');
      updateData.email = data.email;
    }
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...result } = updatedUser;
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const { name, ...profileData } = data;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        accountProfile: {
          upsert: {
            create: profileData,
            update: profileData,
          },
        },
      },
      include: {
        accountProfile: true,
      },
    });

    const { password, ...result } = updatedUser;
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Senha atual incorreta');

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Senha alterada com sucesso',
      timestamp: new Date().toISOString(),
    };
  }
}

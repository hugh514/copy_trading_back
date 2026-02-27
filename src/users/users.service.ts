import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number = 0, take: number = 10) {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      success: true,
      data: {
        users,
        meta: {
          total,
          skip,
          take,
        },
      },
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

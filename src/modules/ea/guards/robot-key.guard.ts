import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RobotKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['x-access-key'];

    if (!key) {
      throw new UnauthorizedException('Access key missing');
    }

    const accessKey = await this.prisma.accessKey.findUnique({
      where: { key },
      include: { user: true },
    });

    if (!accessKey || !accessKey.isEnabled) {
      throw new UnauthorizedException('Invalid or disabled access key');
    }

    request.user = accessKey.user;
    return true;
  }
}

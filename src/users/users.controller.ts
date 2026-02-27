import {
  Controller,
  Get,
  UseGuards,
  Query,
  Patch,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateProfileDto, ChangePasswordDto } from './dto/users.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Listar Usuários (Admin)',
    description:
      'Retorna a lista paginada de usuários. Apenas para administradores.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          users: [
            {
              id: 'uuid-1',
              name: 'Admin',
              email: 'admin@copytrade.com',
              role: 'ADMIN',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
          meta: { total: 1, skip: 0, take: 10 },
        },
      },
    },
  })
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.usersService.findAll(Number(skip) || 0, Number(take) || 10);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Atualizar Perfil',
    description:
      'Permite que o usuário logado atualize seus dados básicos e de perfil.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          name: 'João Silva Atualizado',
          email: 'joao@email.com',
          accountProfile: { language: 'en-US', theme: 'dark' },
        },
      },
    },
  })
  async updateProfile(@Request() req, @Body() data: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, data);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Trocar Senha',
    description: 'Permite que o usuário logado altere sua senha de acesso.',
  })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Senha atual incorreta ou dados inválidos.',
  })
  async changePassword(@Request() req, @Body() data: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, data);
  }
}

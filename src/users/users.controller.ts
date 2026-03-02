import {
  Controller,
  Get,
  UseGuards,
  Query,
  Patch,
  Body,
  Request,
  Post,
  Put,
  Param,
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
import {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserStatusDto,
  AdminUpdateUserDto,
} from './dto/users.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Listar Usuários Enriquecida (Admin)',
    description:
      'Retorna a lista de usuários com dados de moedas ativas e saldo. Apenas para administradores.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Lista enriquecida retornada com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          users: [
            {
              id: 'uuid-123',
              name: 'Carlos Trader',
              email: 'carlos@exemplo.com',
              role: 'CLIENT',
              isActive: true,
              balance: 1500.5,
              activeCurrencies: ['EURUSD', 'BTCUSD'],
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Criação Corporativa (Admin)',
    description:
      'Cria um novo usuário e todos os seus perfis vinculados em uma transação.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-123',
          name: 'Carlos Trader',
          email: 'carlos@exemplo.com',
          role: 'CLIENT',
          isActive: true,
        },
      },
    },
  })
  async create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Controle de Status (Admin)',
    description: 'Ativa ou desativa um usuário do sistema.',
  })
  @ApiResponse({ status: 200, description: 'Status atualizado.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Edição Administrativa (Admin)',
    description: 'Altera dados sensíveis do usuário (Nome, Email, Senha).',
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado.' })
  async updateAdmin(@Param('id') id: string, @Body() data: AdminUpdateUserDto) {
    return this.usersService.updateAdmin(id, data);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Atualizar Perfil (Self)',
    description:
      'Permite que o usuário logado atualize seus dados básicos e de perfil.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso.',
  })
  async updateProfile(@Request() req, @Body() data: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, data);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Trocar Senha (Self)',
    description: 'Permite que o usuário logado altere sua senha de acesso.',
  })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
  async changePassword(@Request() req, @Body() data: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, data);
  }
}

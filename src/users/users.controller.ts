import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Listar Usuários', description: 'Retorna a lista de usuários. Apenas para administradores.' })
    @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.' })
    @ApiResponse({ status: 401, description: 'Não autenticado.' })
    @ApiResponse({ status: 403, description: 'Não autorizado (Não é ADMIN).' })
    async findAll() {
        return this.usersService.findAll();
    }
}

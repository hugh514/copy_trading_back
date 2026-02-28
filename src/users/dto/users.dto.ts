import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export const UpdateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['pt-BR', 'en-US']).default('pt-BR').optional(),
  theme: z.enum(['light', 'dark']).default('light').optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome do usuário',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: '+5511999999999',
    description: 'Telefone para contato',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: 'https://avatar.com/user.png',
    description: 'URL do avatar',
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    example: 'pt-BR',
    enum: ['pt-BR', 'en-US'],
    description: 'Idioma preferencial',
    required: false,
  })
  language?: 'pt-BR' | 'en-US';

  @ApiProperty({
    example: 'dark',
    enum: ['light', 'dark'],
    description: 'Tema da interface',
    required: false,
  })
  theme?: 'light' | 'dark';
}

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  });

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {
  @ApiProperty({
    example: 'senhaAntiga123',
    description: 'Senha atual do usuário',
  })
  oldPassword: string;

  @ApiProperty({ example: 'novaSenha456', description: 'Nova senha desejada' })
  newPassword: string;
}


export const CreateUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'CLIENT']).default('CLIENT'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {
  @ApiProperty({ example: 'João Silva' })
  name: string;
  @ApiProperty({ example: 'joao@exemplo.com' })
  email: string;
  @ApiProperty({ example: 'senha123' })
  password: string;
  @ApiProperty({ enum: ['ADMIN', 'CLIENT'], default: 'CLIENT' })
  role: 'ADMIN' | 'CLIENT';
}

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {
  @ApiProperty({ example: true })
  isActive: boolean;
}

export const AdminUpdateUserSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export class AdminUpdateUserDto extends createZodDto(AdminUpdateUserSchema) {
  @ApiProperty({ example: 'João Silva', required: false })
  name?: string;
  @ApiProperty({ example: 'joao@exemplo.com', required: false })
  email?: string;
  @ApiProperty({ example: 'novaSenha123', required: false })
  password?: string;
}

export class UserViewModel {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ enum: ['ADMIN', 'CLIENT'] })
  role: string;
  @ApiProperty()
  isActive: boolean;
  @ApiProperty({ required: false })
  lastLoginAt?: Date;
  @ApiProperty({ type: [String] })
  activeCurrencies: string[];
  @ApiProperty()
  balance: number;
}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export class LoginDto extends createZodDto(LoginSchema) {
    @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@email.com', pattern: undefined })
    email!: string;

    @ApiProperty({ description: 'Senha do usuário', example: 'senha123', minLength: 6 })
    password!: string;
}

const RegisterSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export class RegisterDto extends createZodDto(RegisterSchema) {
    @ApiProperty({ description: 'Nome do usuário', example: 'João Silva' })
    name!: string;

    @ApiProperty({ description: 'E-mail do usuário', example: 'usuario@email.com', pattern: undefined })
    email!: string;

    @ApiProperty({ description: 'Senha do usuário', example: 'senha123', minLength: 6 })
    password!: string;

    @ApiProperty({ description: 'Confirmação da senha', example: 'senha123', minLength: 6 })
    confirmPassword!: string;
}

const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {
    @ApiProperty({ description: 'E-mail cadastrado', example: 'usuario@email.com', pattern: undefined })
    email!: string;
}

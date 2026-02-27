import { z } from 'nestjs-zod/z';

const LoginSchema = z.object({
  email: z.string().email().describe("E-mail válido"),
});

console.log(LoginSchema);

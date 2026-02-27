import { z } from 'nestjs-zod/z';
try {
  const schema = z.string().email();
  console.log("has openapi?", typeof (schema as any).openapi);
} catch (e) {
  console.error(e);
}

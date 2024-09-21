import { PrismaClient } from '@prisma/client';

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  log: isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
});

export default prisma;

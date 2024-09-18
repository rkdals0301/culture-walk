import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // 로그 레벨
  errorFormat: 'pretty', // 에러 형식
});
export default prisma;

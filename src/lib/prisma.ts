import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  errorFormat: 'pretty', // 에러 형식
});
export default prisma;

import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent TypeScript errors related to redeclaring `prisma` on `globalThis`
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

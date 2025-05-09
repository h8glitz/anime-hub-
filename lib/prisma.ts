import { PrismaClient } from './generated/prisma';

console.log("🔥 USING DATABASE_URL:", process.env.DATABASE_URL)

const prisma = new PrismaClient();
export default prisma; 
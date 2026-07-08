const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected successfully via Prisma!');
  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();

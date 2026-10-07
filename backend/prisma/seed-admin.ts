import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@jobhub.com';
  const plainPassword = 'password123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created! Email: ${email} | Password: ${plainPassword}`);
  } else {
    console.log(`Admin user already exists! Email: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

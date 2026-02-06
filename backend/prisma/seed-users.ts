import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Tworzenie użytkowników...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      password: adminPassword,
      name: 'Jan Kowalski',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'kierownik' },
    update: {},
    create: {
      email: 'kierownik',
      password: userPassword,
      name: 'Anna Nowak',
      role: 'MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'pracownik' },
    update: {},
    create: {
      email: 'pracownik',
      password: userPassword,
      name: 'Piotr Wiśniewski',
      role: 'EMPLOYEE',
    },
  });

  console.log('');
  console.log('🎉 Użytkownicy utworzeni!');
  console.log('');
  console.log('Dane logowania:');
  console.log('  Admin: admin / admin123');
  console.log('  Kierownik: kierownik / user123');
  console.log('  Pracownik: pracownik / user123');
}

main()
  .catch((e) => {
    console.error('Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

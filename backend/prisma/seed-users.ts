import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Tworzenie użytkowników...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@masarnia.pl' },
    update: {},
    create: {
      email: 'admin@masarnia.pl',
      password: adminPassword,
      name: 'Jan Kowalski',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'kierownik@masarnia.pl' },
    update: {},
    create: {
      email: 'kierownik@masarnia.pl',
      password: userPassword,
      name: 'Anna Nowak',
      role: 'MANAGER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'pracownik@masarnia.pl' },
    update: {},
    create: {
      email: 'pracownik@masarnia.pl',
      password: userPassword,
      name: 'Piotr Wiśniewski',
      role: 'EMPLOYEE',
    },
  });

  console.log('');
  console.log('🎉 Użytkownicy utworzeni!');
  console.log('');
  console.log('Dane logowania:');
  console.log('  Admin: admin@masarnia.pl / admin123');
  console.log('  Kierownik: kierownik@masarnia.pl / user123');
  console.log('  Pracownik: pracownik@masarnia.pl / user123');
}

main()
  .catch((e) => {
    console.error('Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function: find or create by name
async function findOrCreateCCP(data: {
  name: string;
  description: string;
  hazardType: string;
  criticalLimit: string;
  monitoringMethod: string;
  monitoringFrequency: string;
  correctiveAction: string;
  verificationMethod: string;
  recordKeeping: string;
}) {
  const existing = await prisma.cCP.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.cCP.create({ data });
}

async function findOrCreateHazard(data: {
  name: string;
  type: string;
  source: string;
  preventiveMeasure: string;
  significance: string;
  processStep: string;
}) {
  const existing = await prisma.hazard.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.hazard.create({ data });
}

async function findOrCreateTemperaturePoint(data: {
  name: string;
  location: string;
  type: string;
  minTemp: number;
  maxTemp: number;
  ccpId?: number;
}) {
  const existing = await prisma.temperaturePoint.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.temperaturePoint.create({ data });
}

async function findOrCreateSupplier(data: {
  name: string;
  address: string;
  phone: string;
  email: string;
  nip: string;
  vetNumber: string;
  productTypes: string;
  certifications: string;
  rating: string;
  isActive: boolean;
}) {
  const existing = await prisma.supplier.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.supplier.create({ data });
}

async function findOrCreateProduct(data: {
  name: string;
  sku: string;
  category: string;
  description: string;
  shelfLife: number;
  storageTemp: string;
  allergens: string;
  packagingType: string;
  unit: string;
  minStock: number;
  isActive: boolean;
}) {
  const existing = await prisma.product.findFirst({ where: { sku: data.sku } });
  if (existing) return existing;
  return prisma.product.create({ data });
}

async function findOrCreateCleaningArea(data: {
  name: string;
  location: string;
  cleaningType: string;
  frequency: string;
  method: string;
  chemicals: string;
  responsibleRole: string;
  isActive: boolean;
}) {
  const existing = await prisma.cleaningArea.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.cleaningArea.create({ data });
}

async function findOrCreatePestControlPoint(data: {
  name: string;
  location: string;
  type: string;
  checkFrequency: string;
  isActive: boolean;
}) {
  const existing = await prisma.pestControlPoint.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.pestControlPoint.create({ data });
}

async function main() {
  console.log('🌱 Rozpoczynam seedowanie bazy danych...');

  // Tworzenie użytkowników
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@masarnia.pl' },
    update: {},
    create: {
      email: 'admin@masarnia.pl',
      password: adminPassword,
      name: 'Jan Kowalski',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'kierownik@masarnia.pl' },
    update: {},
    create: {
      email: 'kierownik@masarnia.pl',
      password: userPassword,
      name: 'Anna Nowak',
      role: 'MANAGER',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'pracownik@masarnia.pl' },
    update: {},
    create: {
      email: 'pracownik@masarnia.pl',
      password: userPassword,
      name: 'Piotr Wiśniewski',
      role: 'EMPLOYEE',
    },
  });

  console.log('✅ Użytkownicy utworzeni');

  // Tworzenie CCP
  const ccp1 = await findOrCreateCCP({
    name: 'CCP1 - Przyjęcie surowców',
    description: 'Kontrola temperatury i jakości surowców przy przyjęciu',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Temperatura mięsa ≤ 7°C, brak oznak zepsucia',
    monitoringMethod: 'Pomiar temperatury termometrem, kontrola wizualna',
    monitoringFrequency: 'Każda dostawa',
    correctiveAction: 'Odrzucenie dostawy, powiadomienie dostawcy',
    verificationMethod: 'Przegląd zapisów, kalibracja termometrów',
    recordKeeping: 'Karta przyjęcia surowca',
  });

  const ccp2 = await findOrCreateCCP({
    name: 'CCP2 - Przechowywanie chłodnicze',
    description: 'Utrzymanie właściwej temperatury w chłodniach',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Temperatura chłodni 0-4°C',
    monitoringMethod: 'Ciągły monitoring temperatury, odczyt 2x dziennie',
    monitoringFrequency: '2 razy dziennie (rano i po południu)',
    correctiveAction: 'Regulacja urządzenia, przeniesienie produktów, naprawa',
    verificationMethod: 'Przegląd zapisów temperatury, kalibracja czujników',
    recordKeeping: 'Dziennik temperatury',
  });

  const ccp3 = await findOrCreateCCP({
    name: 'CCP3 - Obróbka termiczna',
    description: 'Kontrola temperatury wewnętrznej produktu podczas obróbki cieplnej',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Temperatura wewnętrzna produktu ≥ 72°C przez min. 2 minuty',
    monitoringMethod: 'Pomiar temperatury wewnętrznej termometrem szpilkowym',
    monitoringFrequency: 'Każda partia produkcyjna',
    correctiveAction: 'Przedłużenie obróbki termicznej, ponowna obróbka lub odrzucenie partii',
    verificationMethod: 'Przegląd zapisów, kalibracja termometrów, badania mikrobiologiczne',
    recordKeeping: 'Karta kontroli obróbki termicznej',
  });

  const ccps = [ccp1, ccp2, ccp3];
  console.log('✅ Punkty CCP utworzone');

  // Tworzenie zagrożeń - używamy upsert z name jako unikalnym identyfikatorem
  await prisma.hazard.upsert({
    where: { name: 'Salmonella spp.' },
    update: {},
    create: {
      name: 'Salmonella spp.',
      type: 'BIOLOGICAL',
      source: 'Surowce mięsne, zanieczyszczenie krzyżowe',
      preventiveMeasure: 'Kontrola dostawców, temperatura przechowywania, higiena',
      significance: 'HIGH',
      processStep: 'Przyjęcie surowców, przechowywanie',
    },
  });

  await prisma.hazard.upsert({
    where: { name: 'Listeria monocytogenes' },
    update: {},
    create: {
      name: 'Listeria monocytogenes',
      type: 'BIOLOGICAL',
      source: 'Środowisko produkcji, surowce',
      preventiveMeasure: 'Mycie i dezynfekcja, kontrola temperatury',
      significance: 'HIGH',
      processStep: 'Produkcja, przechowywanie',
    },
  });

  await prisma.hazard.upsert({
    where: { name: 'E. coli O157:H7' },
    update: {},
    create: {
      name: 'E. coli O157:H7',
      type: 'BIOLOGICAL',
      source: 'Surowce mięsne wołowe',
      preventiveMeasure: 'Kontrola dostawców, obróbka termiczna',
      significance: 'HIGH',
      processStep: 'Przyjęcie surowców, produkcja',
    },
  });

  await prisma.hazard.upsert({
    where: { name: 'Pozostałości antybiotyków' },
    update: {},
    create: {
      name: 'Pozostałości antybiotyków',
      type: 'CHEMICAL',
      source: 'Surowce mięsne od dostawców',
      preventiveMeasure: 'Certyfikaty od dostawców, kontrola dokumentacji',
      significance: 'MEDIUM',
      processStep: 'Przyjęcie surowców',
    },
  });

  await prisma.hazard.upsert({
    where: { name: 'Fragmenty metalu' },
    update: {},
    create: {
      name: 'Fragmenty metalu',
      type: 'PHYSICAL',
      source: 'Uszkodzone urządzenia, narzędzia',
      preventiveMeasure: 'Przeglądy urządzeń, procedury konserwacji',
      significance: 'MEDIUM',
      processStep: 'Produkcja',
    },
  });

  console.log('✅ Zagrożenia utworzone');

  // Tworzenie punktów temperatury - 3 chłodnie
  const tempPoint1 = await prisma.temperaturePoint.upsert({
    where: { name: 'Chłodnia nr 1' },
    update: {},
    create: {
      name: 'Chłodnia nr 1',
      location: 'Pomieszczenie magazynowe - surowce',
      type: 'COOLER',
      minTemp: 0,
      maxTemp: 4,
      ccpId: ccp2.id,
    },
  });

  const tempPoint2 = await prisma.temperaturePoint.upsert({
    where: { name: 'Chłodnia nr 2' },
    update: {},
    create: {
      name: 'Chłodnia nr 2',
      location: 'Pomieszczenie magazynowe - wyroby gotowe',
      type: 'COOLER',
      minTemp: 0,
      maxTemp: 4,
      ccpId: ccp2.id,
    },
  });

  const tempPoint3 = await prisma.temperaturePoint.upsert({
    where: { name: 'Chłodnia nr 3' },
    update: {},
    create: {
      name: 'Chłodnia nr 3',
      location: 'Pomieszczenie ekspedycji',
      type: 'COOLER',
      minTemp: 0,
      maxTemp: 4,
      ccpId: ccp2.id,
    },
  });

  const tempPoints = [tempPoint1, tempPoint2, tempPoint3];
  console.log('✅ Punkty temperatury utworzone');

  // Przykładowe odczyty temperatury - sprawdzamy czy już istnieją
  const existingReadings = await prisma.temperatureReading.count();
  if (existingReadings === 0) {
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      for (const point of tempPoints) {
        const baseTemp = 2;
        const variation = (Math.random() - 0.5) * 2;
        const temp = baseTemp + variation;
        
        await prisma.temperatureReading.create({
          data: {
            temperaturePointId: point.id,
            temperature: Math.round(temp * 10) / 10,
            isCompliant: temp >= point.minTemp && temp <= point.maxTemp,
            readAt: date,
            userId: admin.id,
          },
        });
      }
    }
    console.log('✅ Odczyty temperatury utworzone');
  } else {
    console.log('⏭️  Odczyty temperatury już istnieją - pomijam');
  }

  // Tworzenie dostawców
  const supplier1 = await prisma.supplier.upsert({
    where: { vetNumber: 'PL12345678WE' },
    update: {},
    create: {
      name: 'Ubojnia Regionalna Sp. z o.o.',
      address: 'ul. Przemysłowa 15, 00-001 Warszawa',
      phone: '+48 22 123 45 67',
      email: 'kontakt@ubojnia.pl',
      vetNumber: 'PL12345678WE',
      contactPerson: 'Marek Kowalczyk',
      isApproved: true,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { email: 'zamowienia@przyprawy.pl' },
    update: {},
    create: {
      name: 'Przyprawy Kulinarne S.A.',
      address: 'ul. Smakowa 8, 00-002 Kraków',
      phone: '+48 12 234 56 78',
      email: 'zamowienia@przyprawy.pl',
      contactPerson: 'Ewa Malinowska',
      isApproved: true,
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { email: 'biuro@opakowania.pl' },
    update: {},
    create: {
      name: 'Opakowania Spożywcze Sp.j.',
      address: 'ul. Pakowa 22, 00-003 Poznań',
      phone: '+48 61 345 67 89',
      email: 'biuro@opakowania.pl',
      contactPerson: 'Tomasz Zieliński',
      isApproved: true,
    },
  });

  const suppliers = [supplier1, supplier2, supplier3];
  console.log('✅ Dostawcy utworzeni');

  // Tworzenie surowców
  await prisma.rawMaterial.upsert({
    where: { name: 'Mięso wieprzowe - szynka' },
    update: {},
    create: {
      name: 'Mięso wieprzowe - szynka',
      category: 'MEAT',
      unit: 'kg',
      supplierId: suppliers[0].id,
      storageConditions: 'Chłodnia 0-4°C',
      shelfLife: 5,
    },
  });

  await prisma.rawMaterial.upsert({
    where: { name: 'Mięso wieprzowe - łopatka' },
    update: {},
    create: {
      name: 'Mięso wieprzowe - łopatka',
      category: 'MEAT',
      unit: 'kg',
      supplierId: suppliers[0].id,
      storageConditions: 'Chłodnia 0-4°C',
      shelfLife: 5,
    },
  });

  await prisma.rawMaterial.upsert({
    where: { name: 'Mięso wołowe - antrykot' },
    update: {},
    create: {
      name: 'Mięso wołowe - antrykot',
      category: 'MEAT',
      unit: 'kg',
      supplierId: suppliers[0].id,
      storageConditions: 'Chłodnia 0-4°C',
      shelfLife: 5,
    },
  });

  await prisma.rawMaterial.upsert({
    where: { name: 'Sól peklująca' },
    update: {},
    create: {
      name: 'Sól peklująca',
      category: 'ADDITIVES',
      unit: 'kg',
      supplierId: suppliers[1].id,
      storageConditions: 'Suche miejsce, temp. pokojowa',
      shelfLife: 365,
    },
  });

  await prisma.rawMaterial.upsert({
    where: { name: 'Pieprz czarny mielony' },
    update: {},
    create: {
      name: 'Pieprz czarny mielony',
      category: 'SPICES',
      unit: 'kg',
      supplierId: suppliers[1].id,
      storageConditions: 'Suche miejsce, temp. pokojowa',
      shelfLife: 180,
    },
  });

  await prisma.rawMaterial.upsert({
    where: { name: 'Osłonki naturalne wieprzowe' },
    update: {},
    create: {
      name: 'Osłonki naturalne wieprzowe',
      category: 'PACKAGING',
      unit: 'szt',
      supplierId: suppliers[2].id,
      storageConditions: 'Chłodnia 0-4°C',
      shelfLife: 30,
    },
  });

  console.log('✅ Surowce utworzone');

  // Tworzenie produktów
  await prisma.product.upsert({
    where: { name: 'Kiełbasa śląska' },
    update: {},
    create: {
      name: 'Kiełbasa śląska',
      category: 'SAUSAGE',
      description: 'Tradycyjna kiełbasa śląska z mięsa wieprzowego',
      unit: 'kg',
      shelfLife: 14,
      storageTemp: '0-4°C',
    },
  });

  await prisma.product.upsert({
    where: { name: 'Szynka wędzona' },
    update: {},
    create: {
      name: 'Szynka wędzona',
      category: 'HAM',
      description: 'Szynka wieprzowa wędzona tradycyjną metodą',
      unit: 'kg',
      shelfLife: 21,
      storageTemp: '0-4°C',
    },
  });

  await prisma.product.upsert({
    where: { name: 'Pasztet domowy' },
    update: {},
    create: {
      name: 'Pasztet domowy',
      category: 'PATE',
      description: 'Pasztet wieprzowy z przyprawami',
      unit: 'kg',
      shelfLife: 10,
      storageTemp: '0-4°C',
    },
  });

  await prisma.product.upsert({
    where: { name: 'Schab wędzony' },
    update: {},
    create: {
      name: 'Schab wędzony',
      category: 'MEAT_CUT',
      description: 'Schab wieprzowy wędzony na zimno',
      unit: 'kg',
      shelfLife: 21,
      storageTemp: '0-4°C',
    },
  });

  console.log('✅ Produkty utworzone');

  // Tworzenie obszarów mycia
  await prisma.cleaningArea.upsert({
    where: { name: 'Hala produkcyjna' },
    update: {},
    create: {
      name: 'Hala produkcyjna',
      location: 'Budynek główny - parter',
      frequency: 'DAILY',
      method: 'Mycie na mokro, dezynfekcja',
      chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
    },
  });

  await prisma.cleaningArea.upsert({
    where: { name: 'Chłodnie' },
    update: {},
    create: {
      name: 'Chłodnie',
      location: 'Budynek magazynowy',
      frequency: 'WEEKLY',
      method: 'Mycie ścian i podłóg, dezynfekcja',
      chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
    },
  });

  await prisma.cleaningArea.upsert({
    where: { name: 'Urządzenia produkcyjne' },
    update: {},
    create: {
      name: 'Urządzenia produkcyjne',
      location: 'Hala produkcyjna',
      frequency: 'DAILY',
      method: 'Demontaż, mycie, dezynfekcja, suszenie',
      chemicals: 'Środek myjący do urządzeń MU-100',
    },
  });

  await prisma.cleaningArea.upsert({
    where: { name: 'Wędzarnia' },
    update: {},
    create: {
      name: 'Wędzarnia',
      location: 'Budynek główny - zaplecze',
      frequency: 'WEEKLY',
      method: 'Czyszczenie komór, usuwanie sadzy',
      chemicals: 'Środek do czyszczenia wędzarni WC-300',
    },
  });

  console.log('✅ Obszary mycia utworzone');

  // Tworzenie punktów kontroli DDD
  await prisma.pestControlPoint.upsert({
    where: { name: 'Stacja deratyzacyjna 1' },
    update: {},
    create: {
      name: 'Stacja deratyzacyjna 1',
      location: 'Wejście główne - zewnętrzne',
      type: 'BAIT_STATION',
    },
  });

  await prisma.pestControlPoint.upsert({
    where: { name: 'Stacja deratyzacyjna 2' },
    update: {},
    create: {
      name: 'Stacja deratyzacyjna 2',
      location: 'Magazyn - zewnętrzne',
      type: 'BAIT_STATION',
    },
  });

  await prisma.pestControlPoint.upsert({
    where: { name: 'Lampa owadobójcza 1' },
    update: {},
    create: {
      name: 'Lampa owadobójcza 1',
      location: 'Hala produkcyjna - wejście',
      type: 'UV_LAMP',
    },
  });

  await prisma.pestControlPoint.upsert({
    where: { name: 'Pułapka na insekty 1' },
    update: {},
    create: {
      name: 'Pułapka na insekty 1',
      location: 'Magazyn surowców',
      type: 'INSECT_TRAP',
    },
  });

  console.log('✅ Punkty kontroli DDD utworzone');

  // Tworzenie list kontrolnych audytu
  await prisma.auditChecklist.upsert({
    where: { name: 'Audyt GHP - Higiena ogólna' },
    update: {},
    create: {
      name: 'Audyt GHP - Higiena ogólna',
      category: 'GHP',
      items: JSON.stringify([
        { id: 1, question: 'Czy pracownicy noszą czystą odzież ochronną?', category: 'Higiena osobista' },
        { id: 2, question: 'Czy dostępne są środki do mycia i dezynfekcji rąk?', category: 'Higiena osobista' },
        { id: 3, question: 'Czy powierzchnie robocze są czyste?', category: 'Czystość' },
        { id: 4, question: 'Czy urządzenia są w dobrym stanie technicznym?', category: 'Urządzenia' },
        { id: 5, question: 'Czy odpady są właściwie segregowane i usuwane?', category: 'Odpady' },
        { id: 6, question: 'Czy pomieszczenia są dobrze wentylowane?', category: 'Infrastruktura' },
        { id: 7, question: 'Czy oświetlenie jest wystarczające?', category: 'Infrastruktura' },
        { id: 8, question: 'Czy drzwi i okna są zabezpieczone przed szkodnikami?', category: 'DDD' },
      ]),
    },
  });

  await prisma.auditChecklist.upsert({
    where: { name: 'Audyt HACCP - Punkty krytyczne' },
    update: {},
    create: {
      name: 'Audyt HACCP - Punkty krytyczne',
      category: 'HACCP',
      items: JSON.stringify([
        { id: 1, question: 'Czy temperatura w chłodniach mieści się w limitach?', category: 'CCP' },
        { id: 2, question: 'Czy zapisy temperatury są prowadzone regularnie?', category: 'Dokumentacja' },
        { id: 3, question: 'Czy surowce są kontrolowane przy przyjęciu?', category: 'CCP' },
        { id: 4, question: 'Czy produkty są właściwie oznakowane?', category: 'Traceability' },
        { id: 5, question: 'Czy działania korygujące są wdrażane?', category: 'Korekta' },
        { id: 6, question: 'Czy procedury są aktualne i dostępne?', category: 'Dokumentacja' },
      ]),
    },
  });

  console.log('✅ Listy kontrolne audytu utworzone');

  // Tworzenie szkoleń - sprawdzamy czy już istnieją
  const existingTrainings = await prisma.trainingRecord.count();
  if (existingTrainings === 0) {
    await prisma.trainingRecord.create({
      data: {
        title: 'Szkolenie wstępne HACCP',
        type: 'HACCP',
        description: 'Podstawowe zasady systemu HACCP',
        trainer: 'Jan Kowalski',
        trainingDate: new Date('2024-01-15'),
        validUntil: new Date('2025-01-15'),
        participants: {
          create: [
            { userId: employee.id, passed: true },
            { userId: manager.id, passed: true },
          ],
        },
      },
    });

    await prisma.trainingRecord.create({
      data: {
        title: 'Szkolenie GHP/GMP',
        type: 'GHP',
        description: 'Dobre praktyki higieniczne i produkcyjne',
        trainer: 'Anna Nowak',
        trainingDate: new Date('2024-01-20'),
        validUntil: new Date('2025-01-20'),
        participants: {
          create: [
            { userId: employee.id, passed: true },
          ],
        },
      },
    });
    console.log('✅ Szkolenia utworzone');
  } else {
    console.log('⏭️  Szkolenia już istnieją - pomijam');
  }

  // Tworzenie dokumentów
  await prisma.document.upsert({
    where: { fileName: 'procedura_przyjecia.pdf' },
    update: {},
    create: {
      title: 'Procedura przyjęcia surowców',
      category: 'PROCEDURE',
      fileName: 'procedura_przyjecia.pdf',
      filePath: '/documents/procedury/procedura_przyjecia.pdf',
      version: '2.0',
      uploadedBy: admin.id,
    },
  });

  await prisma.document.upsert({
    where: { fileName: 'instrukcja_mycia.pdf' },
    update: {},
    create: {
      title: 'Instrukcja mycia i dezynfekcji',
      category: 'INSTRUCTION',
      fileName: 'instrukcja_mycia.pdf',
      filePath: '/documents/instrukcje/instrukcja_mycia.pdf',
      version: '1.5',
      uploadedBy: admin.id,
    },
  });

  await prisma.document.upsert({
    where: { fileName: 'formularz_temp.pdf' },
    update: {},
    create: {
      title: 'Formularz kontroli temperatury',
      category: 'FORM',
      fileName: 'formularz_temp.pdf',
      filePath: '/documents/formularze/formularz_temp.pdf',
      version: '1.0',
      uploadedBy: admin.id,
    },
  });

  await prisma.document.upsert({
    where: { fileName: 'plan_haccp.pdf' },
    update: {},
    create: {
      title: 'Plan HACCP',
      category: 'PROCEDURE',
      fileName: 'plan_haccp.pdf',
      filePath: '/documents/procedury/plan_haccp.pdf',
      version: '3.0',
      uploadedBy: admin.id,
    },
  });

  console.log('✅ Dokumenty utworzone');

  console.log('');
  console.log('🎉 Seedowanie zakończone pomyślnie!');
  console.log('');
  console.log('Dane logowania:');
  console.log('  Admin: admin@masarnia.pl / admin123');
  console.log('  Kierownik: kierownik@masarnia.pl / user123');
  console.log('  Pracownik: pracownik@masarnia.pl / user123');
}

main()
  .catch((e) => {
    console.error('Błąd seedowania:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  const ccps = await Promise.all([
    prisma.cCP.create({
      data: {
        name: 'CCP1 - Przyjęcie surowców',
        description: 'Kontrola temperatury i jakości surowców przy przyjęciu',
        hazardType: 'BIOLOGICAL',
        criticalLimit: 'Temperatura mięsa ≤ 7°C, brak oznak zepsucia',
        monitoringMethod: 'Pomiar temperatury termometrem, kontrola wizualna',
        monitoringFrequency: 'Każda dostawa',
        correctiveAction: 'Odrzucenie dostawy, powiadomienie dostawcy',
        verificationMethod: 'Przegląd zapisów, kalibracja termometrów',
        recordKeeping: 'Karta przyjęcia surowca',
      },
    }),
    prisma.cCP.create({
      data: {
        name: 'CCP2 - Przechowywanie chłodnicze',
        description: 'Utrzymanie właściwej temperatury w chłodniach',
        hazardType: 'BIOLOGICAL',
        criticalLimit: 'Temperatura chłodni 0-4°C',
        monitoringMethod: 'Ciągły monitoring temperatury, odczyt 2x dziennie',
        monitoringFrequency: '2 razy dziennie (rano i po południu)',
        correctiveAction: 'Regulacja urządzenia, przeniesienie produktów, naprawa',
        verificationMethod: 'Przegląd zapisów temperatury, kalibracja czujników',
        recordKeeping: 'Dziennik temperatury',
      },
    }),
    prisma.cCP.create({
      data: {
        name: 'CCP3 - Obróbka termiczna',
        description: 'Kontrola temperatury wewnętrznej produktu podczas obróbki cieplnej',
        hazardType: 'BIOLOGICAL',
        criticalLimit: 'Temperatura wewnętrzna produktu ≥ 72°C przez min. 2 minuty',
        monitoringMethod: 'Pomiar temperatury wewnętrznej termometrem szpilkowym',
        monitoringFrequency: 'Każda partia produkcyjna',
        correctiveAction: 'Przedłużenie obróbki termicznej, ponowna obróbka lub odrzucenie partii',
        verificationMethod: 'Przegląd zapisów, kalibracja termometrów, badania mikrobiologiczne',
        recordKeeping: 'Karta kontroli obróbki termicznej',
      },
    }),
  ]);

  console.log('✅ Punkty CCP utworzone');

  // Tworzenie zagrożeń
  await Promise.all([
    prisma.hazard.create({
      data: {
        name: 'Salmonella spp.',
        type: 'BIOLOGICAL',
        source: 'Surowce mięsne, zanieczyszczenie krzyżowe',
        preventiveMeasure: 'Kontrola dostawców, temperatura przechowywania, higiena',
        significance: 'HIGH',
        processStep: 'Przyjęcie surowców, przechowywanie',
      },
    }),
    prisma.hazard.create({
      data: {
        name: 'Listeria monocytogenes',
        type: 'BIOLOGICAL',
        source: 'Środowisko produkcji, surowce',
        preventiveMeasure: 'Mycie i dezynfekcja, kontrola temperatury',
        significance: 'HIGH',
        processStep: 'Produkcja, przechowywanie',
      },
    }),
    prisma.hazard.create({
      data: {
        name: 'E. coli O157:H7',
        type: 'BIOLOGICAL',
        source: 'Surowce mięsne wołowe',
        preventiveMeasure: 'Kontrola dostawców, obróbka termiczna',
        significance: 'HIGH',
        processStep: 'Przyjęcie surowców, produkcja',
      },
    }),
    prisma.hazard.create({
      data: {
        name: 'Pozostałości antybiotyków',
        type: 'CHEMICAL',
        source: 'Surowce mięsne od dostawców',
        preventiveMeasure: 'Certyfikaty od dostawców, kontrola dokumentacji',
        significance: 'MEDIUM',
        processStep: 'Przyjęcie surowców',
      },
    }),
    prisma.hazard.create({
      data: {
        name: 'Fragmenty metalu',
        type: 'PHYSICAL',
        source: 'Uszkodzone urządzenia, narzędzia',
        preventiveMeasure: 'Przeglądy urządzeń, procedury konserwacji',
        significance: 'MEDIUM',
        processStep: 'Produkcja',
      },
    }),
  ]);

  console.log('✅ Zagrożenia utworzone');

  // Tworzenie punktów temperatury - 3 chłodnie
  const tempPoints = await Promise.all([
    prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 1',
        location: 'Pomieszczenie magazynowe - surowce',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccps[1].id, // CCP2 - Przechowywanie chłodnicze
      },
    }),
    prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 2',
        location: 'Pomieszczenie magazynowe - wyroby gotowe',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccps[1].id,
      },
    }),
    prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 3',
        location: 'Pomieszczenie ekspedycji',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccps[1].id,
      },
    }),
  ]);

  console.log('✅ Punkty temperatury utworzone');

  // Przykładowe odczyty temperatury
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

  // Tworzenie dostawców
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Ubojnia Regionalna Sp. z o.o.',
        address: 'ul. Przemysłowa 15, 00-001 Warszawa',
        phone: '+48 22 123 45 67',
        email: 'kontakt@ubojnia.pl',
        vetNumber: 'PL12345678WE',
        contactPerson: 'Marek Kowalczyk',
        isApproved: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Przyprawy Kulinarne S.A.',
        address: 'ul. Smakowa 8, 00-002 Kraków',
        phone: '+48 12 234 56 78',
        email: 'zamowienia@przyprawy.pl',
        contactPerson: 'Ewa Malinowska',
        isApproved: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Opakowania Spożywcze Sp.j.',
        address: 'ul. Pakowa 22, 00-003 Poznań',
        phone: '+48 61 345 67 89',
        email: 'biuro@opakowania.pl',
        contactPerson: 'Tomasz Zieliński',
        isApproved: true,
      },
    }),
  ]);

  console.log('✅ Dostawcy utworzeni');

  // Tworzenie surowców
  const materials = await Promise.all([
    prisma.rawMaterial.create({
      data: {
        name: 'Mięso wieprzowe - szynka',
        category: 'MEAT',
        unit: 'kg',
        supplierId: suppliers[0].id,
        storageConditions: 'Chłodnia 0-4°C',
        shelfLife: 5,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Mięso wieprzowe - łopatka',
        category: 'MEAT',
        unit: 'kg',
        supplierId: suppliers[0].id,
        storageConditions: 'Chłodnia 0-4°C',
        shelfLife: 5,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Mięso wołowe - antrykot',
        category: 'MEAT',
        unit: 'kg',
        supplierId: suppliers[0].id,
        storageConditions: 'Chłodnia 0-4°C',
        shelfLife: 5,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Sól peklująca',
        category: 'ADDITIVES',
        unit: 'kg',
        supplierId: suppliers[1].id,
        storageConditions: 'Suche miejsce, temp. pokojowa',
        shelfLife: 365,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Pieprz czarny mielony',
        category: 'SPICES',
        unit: 'kg',
        supplierId: suppliers[1].id,
        storageConditions: 'Suche miejsce, temp. pokojowa',
        shelfLife: 180,
      },
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Osłonki naturalne wieprzowe',
        category: 'PACKAGING',
        unit: 'szt',
        supplierId: suppliers[2].id,
        storageConditions: 'Chłodnia 0-4°C',
        shelfLife: 30,
      },
    }),
  ]);

  console.log('✅ Surowce utworzone');

  // Tworzenie produktów
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Kiełbasa śląska',
        category: 'SAUSAGE',
        description: 'Tradycyjna kiełbasa śląska z mięsa wieprzowego',
        unit: 'kg',
        shelfLife: 14,
        storageTemp: '0-4°C',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Szynka wędzona',
        category: 'HAM',
        description: 'Szynka wieprzowa wędzona tradycyjną metodą',
        unit: 'kg',
        shelfLife: 21,
        storageTemp: '0-4°C',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pasztet domowy',
        category: 'PATE',
        description: 'Pasztet wieprzowy z przyprawami',
        unit: 'kg',
        shelfLife: 10,
        storageTemp: '0-4°C',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Schab wędzony',
        category: 'MEAT_CUT',
        description: 'Schab wieprzowy wędzony na zimno',
        unit: 'kg',
        shelfLife: 21,
        storageTemp: '0-4°C',
      },
    }),
  ]);

  console.log('✅ Produkty utworzone');

  // Tworzenie obszarów mycia
  const cleaningAreas = await Promise.all([
    prisma.cleaningArea.create({
      data: {
        name: 'Hala produkcyjna',
        location: 'Budynek główny - parter',
        frequency: 'DAILY',
        method: 'Mycie na mokro, dezynfekcja',
        chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
      },
    }),
    prisma.cleaningArea.create({
      data: {
        name: 'Chłodnie',
        location: 'Budynek magazynowy',
        frequency: 'WEEKLY',
        method: 'Mycie ścian i podłóg, dezynfekcja',
        chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
      },
    }),
    prisma.cleaningArea.create({
      data: {
        name: 'Urządzenia produkcyjne',
        location: 'Hala produkcyjna',
        frequency: 'DAILY',
        method: 'Demontaż, mycie, dezynfekcja, suszenie',
        chemicals: 'Środek myjący do urządzeń MU-100',
      },
    }),
    prisma.cleaningArea.create({
      data: {
        name: 'Wędzarnia',
        location: 'Budynek główny - zaplecze',
        frequency: 'WEEKLY',
        method: 'Czyszczenie komór, usuwanie sadzy',
        chemicals: 'Środek do czyszczenia wędzarni WC-300',
      },
    }),
  ]);

  console.log('✅ Obszary mycia utworzone');

  // Tworzenie punktów kontroli DDD
  const pestPoints = await Promise.all([
    prisma.pestControlPoint.create({
      data: {
        name: 'Stacja deratyzacyjna 1',
        location: 'Wejście główne - zewnętrzne',
        type: 'BAIT_STATION',
      },
    }),
    prisma.pestControlPoint.create({
      data: {
        name: 'Stacja deratyzacyjna 2',
        location: 'Magazyn - zewnętrzne',
        type: 'BAIT_STATION',
      },
    }),
    prisma.pestControlPoint.create({
      data: {
        name: 'Lampa owadobójcza 1',
        location: 'Hala produkcyjna - wejście',
        type: 'UV_LAMP',
      },
    }),
    prisma.pestControlPoint.create({
      data: {
        name: 'Pułapka na insekty 1',
        location: 'Magazyn surowców',
        type: 'INSECT_TRAP',
      },
    }),
  ]);

  console.log('✅ Punkty kontroli DDD utworzone');

  // Tworzenie list kontrolnych audytu
  const checklists = await Promise.all([
    prisma.auditChecklist.create({
      data: {
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
    }),
    prisma.auditChecklist.create({
      data: {
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
    }),
  ]);

  console.log('✅ Listy kontrolne audytu utworzone');

  // Tworzenie szkoleń
  await Promise.all([
    prisma.trainingRecord.create({
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
    }),
    prisma.trainingRecord.create({
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
    }),
  ]);

  console.log('✅ Szkolenia utworzone');

  // Tworzenie dokumentów
  await Promise.all([
    prisma.document.create({
      data: {
        title: 'Procedura przyjęcia surowców',
        category: 'PROCEDURE',
        fileName: 'procedura_przyjecia.pdf',
        filePath: '/documents/procedury/procedura_przyjecia.pdf',
        version: '2.0',
        uploadedBy: admin.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'Instrukcja mycia i dezynfekcji',
        category: 'INSTRUCTION',
        fileName: 'instrukcja_mycia.pdf',
        filePath: '/documents/instrukcje/instrukcja_mycia.pdf',
        version: '1.5',
        uploadedBy: admin.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'Formularz kontroli temperatury',
        category: 'FORM',
        fileName: 'formularz_temp.pdf',
        filePath: '/documents/formularze/formularz_temp.pdf',
        version: '1.0',
        uploadedBy: admin.id,
      },
    }),
    prisma.document.create({
      data: {
        title: 'Plan HACCP',
        category: 'PROCEDURE',
        fileName: 'plan_haccp.pdf',
        filePath: '/documents/procedury/plan_haccp.pdf',
        version: '3.0',
        uploadedBy: admin.id,
      },
    }),
  ]);

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

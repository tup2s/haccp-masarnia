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
    name: 'CP1 - Przyjęcie surowców',
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
    name: 'CP2 - Przechowywanie chłodnicze',
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
    name: 'CCP1 - Obróbka termiczna',
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
  console.log('✅ Punkty CP i CCP utworzone');

  // Tworzenie zagrożeń - sprawdzamy czy już istnieją
  const existingHazards = await prisma.hazard.count();
  if (existingHazards === 0) {
    await prisma.hazard.createMany({
      data: [
        {
          name: 'Salmonella spp.',
          type: 'BIOLOGICAL',
          source: 'Surowce mięsne, zanieczyszczenie krzyżowe',
          preventiveMeasure: 'Kontrola dostawców, temperatura przechowywania, higiena',
          significance: 'HIGH',
          processStep: 'Przyjęcie surowców, przechowywanie',
        },
        {
          name: 'Listeria monocytogenes',
          type: 'BIOLOGICAL',
          source: 'Środowisko, zanieczyszczone powierzchnie',
          preventiveMeasure: 'Higienizacja, kontrola temperatury',
          significance: 'HIGH',
          processStep: 'Przechowywanie, obróbka',
        },
        {
          name: 'E. coli O157:H7',
          type: 'BIOLOGICAL',
          source: 'Surowce mięsne wołowe',
          preventiveMeasure: 'Kontrola dostawców, obróbka termiczna',
          significance: 'HIGH',
          processStep: 'Przyjęcie surowców, produkcja',
        },
        {
          name: 'Pozostałości antybiotyków',
          type: 'CHEMICAL',
          source: 'Surowce mięsne od dostawców',
          preventiveMeasure: 'Certyfikaty od dostawców, kontrola dokumentacji',
          significance: 'MEDIUM',
          processStep: 'Przyjęcie surowców',
        },
        {
          name: 'Fragmenty metalu',
          type: 'PHYSICAL',
          source: 'Uszkodzone urządzenia, narzędzia',
          preventiveMeasure: 'Przeglądy urządzeń, procedury konserwacji',
          significance: 'MEDIUM',
          processStep: 'Produkcja',
        },
      ],
    });
  }

  console.log('✅ Zagrożenia utworzone');

  // Tworzenie punktów temperatury - 3 chłodnie
  const existingTempPoints = await prisma.temperaturePoint.count();
  let tempPoint1, tempPoint2, tempPoint3;
  
  if (existingTempPoints === 0) {
    tempPoint1 = await prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 1',
        location: 'Pomieszczenie magazynowe - surowce',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccp2.id,
      },
    });

    tempPoint2 = await prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 2',
        location: 'Pomieszczenie magazynowe - wyroby gotowe',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccp2.id,
      },
    });

    tempPoint3 = await prisma.temperaturePoint.create({
      data: {
        name: 'Chłodnia nr 3',
        location: 'Pomieszczenie ekspedycji',
        type: 'COOLER',
        minTemp: 0,
        maxTemp: 4,
        ccpId: ccp2.id,
      },
    });
  } else {
    // Pobierz istniejące punkty temperatury
    tempPoint1 = await prisma.temperaturePoint.findFirst({ where: { name: 'Chłodnia nr 1' } });
    tempPoint2 = await prisma.temperaturePoint.findFirst({ where: { name: 'Chłodnia nr 2' } });
    tempPoint3 = await prisma.temperaturePoint.findFirst({ where: { name: 'Chłodnia nr 3' } });
  }

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
  const existingSuppliers = await prisma.supplier.count();
  let supplier1, supplier2, supplier3;
  
  if (existingSuppliers === 0) {
    supplier1 = await prisma.supplier.create({
      data: {
        name: 'Ubojnia Regionalna Sp. z o.o.',
        address: 'ul. Przemysłowa 15, 00-001 Warszawa',
        phone: '+48 22 123 45 67',
        email: 'kontakt@ubojnia.pl',
        vetNumber: 'PL12345678WE',
        contactPerson: 'Marek Kowalczyk',
        isApproved: true,
      },
    });

    supplier2 = await prisma.supplier.create({
      data: {
        name: 'Przyprawy Kulinarne S.A.',
        address: 'ul. Smakowa 8, 00-002 Kraków',
        phone: '+48 12 234 56 78',
        email: 'zamowienia@przyprawy.pl',
        contactPerson: 'Ewa Malinowska',
        isApproved: true,
      },
    });

    supplier3 = await prisma.supplier.create({
      data: {
        name: 'Opakowania Spożywcze Sp.j.',
        address: 'ul. Pakowa 22, 00-003 Poznań',
        phone: '+48 61 345 67 89',
        email: 'biuro@opakowania.pl',
        contactPerson: 'Tomasz Zieliński',
        isApproved: true,
      },
    });
  } else {
    // Pobierz istniejących dostawców
    supplier1 = await prisma.supplier.findFirst({ where: { name: 'Ubojnia Regionalna Sp. z o.o.' } });
    supplier2 = await prisma.supplier.findFirst({ where: { name: 'Przyprawy Kulinarne S.A.' } });
    supplier3 = await prisma.supplier.findFirst({ where: { name: 'Opakowania Spożywcze Sp.j.' } });
  }

  const suppliers = [supplier1, supplier2, supplier3];
  console.log('✅ Dostawcy utworzeni');

  // Tworzenie surowców
  const existingRawMaterials = await prisma.rawMaterial.count();
  if (existingRawMaterials === 0) {
    await prisma.rawMaterial.createMany({
      data: [
        {
          name: 'Mięso wieprzowe - szynka',
          category: 'MEAT',
          unit: 'kg',
          supplierId: supplier1!.id,
          storageConditions: 'Chłodnia 0-4°C',
          shelfLife: 5,
        },
        {
          name: 'Mięso wieprzowe - łopatka',
          category: 'MEAT',
          unit: 'kg',
          supplierId: supplier1!.id,
          storageConditions: 'Chłodnia 0-4°C',
          shelfLife: 5,
        },
        {
          name: 'Mięso wołowe - antrykot',
          category: 'MEAT',
          unit: 'kg',
          supplierId: supplier1!.id,
          storageConditions: 'Chłodnia 0-4°C',
          shelfLife: 5,
        },
        {
          name: 'Sól peklująca',
          category: 'ADDITIVES',
          unit: 'kg',
          supplierId: supplier2!.id,
          storageConditions: 'Suche miejsce, temp. pokojowa',
          shelfLife: 365,
        },
        {
          name: 'Pieprz czarny mielony',
          category: 'SPICES',
          unit: 'kg',
          supplierId: supplier2!.id,
          storageConditions: 'Suche miejsce, temp. pokojowa',
          shelfLife: 180,
        },
        {
          name: 'Osłonki naturalne wieprzowe',
          category: 'PACKAGING',
          unit: 'szt',
          supplierId: supplier3!.id,
          storageConditions: 'Chłodnia 0-4°C',
          shelfLife: 30,
        },
      ],
    });
  }

  console.log('✅ Surowce utworzone');

  // Tworzenie produktów
  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: 'Kiełbasa śląska',
          category: 'SAUSAGE',
          description: 'Tradycyjna kiełbasa śląska z mięsa wieprzowego',
          unit: 'kg',
          shelfLife: 14,
          storageTemp: '0-4°C',
          requiredTemperature: 72,
        },
        {
          name: 'Szynka wędzona',
          category: 'HAM',
          description: 'Szynka wieprzowa wędzona tradycyjną metodą',
          unit: 'kg',
          shelfLife: 21,
          storageTemp: '0-4°C',
          requiredTemperature: 72,
        },
        {
          name: 'Pasztet domowy',
          category: 'PATE',
          description: 'Pasztet wieprzowy z przyprawami',
          unit: 'kg',
          shelfLife: 10,
          storageTemp: '0-4°C',
          requiredTemperature: 72,
        },
        {
          name: 'Schab wędzony',
          category: 'MEAT_CUT',
          description: 'Schab wieprzowy wędzony na zimno',
          unit: 'kg',
          shelfLife: 21,
          storageTemp: '0-4°C',
          requiredTemperature: 72,
        },
        {
          name: 'Kiełbasa Biała',
          category: 'SAUSAGE',
          description: 'Kiełbasa biała gotowana - nie wymaga wysokiej temperatury',
          unit: 'kg',
          shelfLife: 7,
          storageTemp: '0-4°C',
          requiredTemperature: 60, // Niższa temperatura dla kiełbasy białej
        },
      ],
    });
  }

  console.log('✅ Produkty utworzone');

  // Tworzenie obszarów mycia
  const existingCleaningAreas = await prisma.cleaningArea.count();
  if (existingCleaningAreas === 0) {
    await prisma.cleaningArea.createMany({
      data: [
        {
          name: 'Hala produkcyjna',
          location: 'Budynek główny - parter',
          frequency: 'DAILY',
          method: 'Mycie na mokro, dezynfekcja',
          chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
        },
        {
          name: 'Chłodnie',
          location: 'Budynek magazynowy',
          frequency: 'WEEKLY',
          method: 'Mycie ścian i podłóg, dezynfekcja',
          chemicals: 'Środek myjący ALK-200, Dezynfektant DZ-50',
        },
        {
          name: 'Urządzenia produkcyjne',
          location: 'Hala produkcyjna',
          frequency: 'DAILY',
          method: 'Demontaż, mycie, dezynfekcja, suszenie',
          chemicals: 'Środek myjący do urządzeń MU-100',
        },
        {
          name: 'Wędzarnia',
          location: 'Budynek główny - zaplecze',
          frequency: 'WEEKLY',
          method: 'Czyszczenie komór, usuwanie sadzy',
          chemicals: 'Środek do czyszczenia wędzarni WC-300',
        },
      ],
    });
  }

  console.log('✅ Obszary mycia utworzone');

  // Tworzenie punktów kontroli DDD
  const existingPestPoints = await prisma.pestControlPoint.count();
  if (existingPestPoints === 0) {
    await prisma.pestControlPoint.createMany({
      data: [
        {
          name: 'Stacja deratyzacyjna 1',
          location: 'Wejście główne - zewnętrzne',
          type: 'BAIT_STATION',
        },
        {
          name: 'Stacja deratyzacyjna 2',
          location: 'Magazyn - zewnętrzne',
          type: 'BAIT_STATION',
        },
        {
          name: 'Lampa owadobójcza 1',
          location: 'Hala produkcyjna - wejście',
          type: 'UV_LAMP',
        },
        {
          name: 'Pułapka na insekty 1',
          location: 'Magazyn surowców',
          type: 'INSECT_TRAP',
        },
      ],
    });
  }
  console.log('✅ Punkty kontroli DDD utworzone');

  // Tworzenie list kontrolnych audytu
  const existingChecklists = await prisma.auditChecklist.count();
  if (existingChecklists === 0) {
    await prisma.auditChecklist.createMany({
      data: [
        {
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
        {
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
      ],
    });
  }

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
  const existingDocuments = await prisma.document.count();
  if (existingDocuments === 0) {
    await prisma.document.createMany({
      data: [
        {
          title: 'Procedura przyjęcia surowców',
          category: 'PROCEDURE',
          fileName: 'procedura_przyjecia.pdf',
          filePath: '/documents/procedury/procedura_przyjecia.pdf',
          version: '2.0',
          uploadedBy: admin.id,
        },
        {
          title: 'Instrukcja mycia i dezynfekcji',
          category: 'INSTRUCTION',
          fileName: 'instrukcja_mycia.pdf',
          filePath: '/documents/instrukcje/instrukcja_mycia.pdf',
          version: '1.5',
          uploadedBy: admin.id,
        },
        {
          title: 'Formularz kontroli temperatury',
          category: 'FORM',
          fileName: 'formularz_temp.pdf',
          filePath: '/documents/formularze/formularz_temp.pdf',
          version: '1.0',
          uploadedBy: admin.id,
        },
        {
          title: 'Plan HACCP',
          category: 'PROCEDURE',
          fileName: 'plan_haccp.pdf',
          filePath: '/documents/procedury/plan_haccp.pdf',
          version: '3.0',
          uploadedBy: admin.id,
        },
      ],
    });
  }

  console.log('✅ Dokumenty utworzone');

  // ============================================
  // TYPY BADAŃ LABORATORYJNYCH
  // ============================================
  const labTestTypesCount = await prisma.labTestType.count();
  if (labTestTypesCount === 0) {
    await prisma.labTestType.createMany({
      data: [
        // Badania mikrobiologiczne
        { name: 'Salmonella', category: 'MIKROBIOLOGICZNE', unit: null, normText: 'nieobecne w 25g', frequency: 'co miesiąc', description: 'Wykrywanie Salmonella spp.' },
        { name: 'Listeria monocytogenes', category: 'MIKROBIOLOGICZNE', unit: null, normText: 'nieobecne w 25g', frequency: 'co miesiąc', description: 'Wykrywanie L. monocytogenes' },
        { name: 'E. coli', category: 'MIKROBIOLOGICZNE', unit: 'CFU/g', normMax: 500, frequency: 'co miesiąc', description: 'Liczba E. coli' },
        { name: 'STEC/VTEC', category: 'MIKROBIOLOGICZNE', unit: null, normText: 'nieobecne w 25g', frequency: 'co kwartał', description: 'E. coli produkujące werotoksyny' },
        { name: 'Enterobacteriaceae', category: 'MIKROBIOLOGICZNE', unit: 'CFU/g', normMax: 1000, frequency: 'co miesiąc', description: 'Bakterie z rodziny Enterobacteriaceae' },
        { name: 'OLM (ogólna liczba drobnoustrojów)', category: 'MIKROBIOLOGICZNE', unit: 'CFU/g', normMax: 100000, frequency: 'co miesiąc', description: 'Ogólna liczba drobnoustrojów mezofilnych' },
        // Badania fizykochemiczne
        { name: 'Zawartość białka', category: 'FIZYKOCHEMICZNE', unit: '%', normMin: 12, frequency: 'co kwartał', description: 'Oznaczanie zawartości białka' },
        { name: 'Zawartość tłuszczu', category: 'FIZYKOCHEMICZNE', unit: '%', normMax: 30, frequency: 'co kwartał', description: 'Oznaczanie zawartości tłuszczu' },
        { name: 'Zawartość wody', category: 'FIZYKOCHEMICZNE', unit: '%', normMax: 70, frequency: 'co kwartał', description: 'Oznaczanie zawartości wody' },
        { name: 'Zawartość soli (NaCl)', category: 'FIZYKOCHEMICZNE', unit: '%', normMax: 3.5, frequency: 'co kwartał', description: 'Oznaczanie zawartości chlorku sodu' },
        { name: 'Azotany i azotyny', category: 'FIZYKOCHEMICZNE', unit: 'mg/kg', normMax: 150, frequency: 'co kwartał', description: 'Pozostałości azotanów i azotynów' },
        { name: 'pH produktu', category: 'FIZYKOCHEMICZNE', unit: '', normMin: 5.5, normMax: 6.5, frequency: 'co tydzień', description: 'Pomiar pH produktu' },
        { name: 'Aktywność wody (aw)', category: 'FIZYKOCHEMICZNE', unit: '', normMax: 0.95, frequency: 'co kwartał', description: 'Aktywność wody' },
        // Badania trwałości
        { name: 'Badanie trwałości - 7 dni', category: 'TRWAŁOŚĆ', unit: null, frequency: 'przy nowym produkcie', description: 'Badanie trwałości produktu po 7 dniach' },
        { name: 'Badanie trwałości - 14 dni', category: 'TRWAŁOŚĆ', unit: null, frequency: 'przy nowym produkcie', description: 'Badanie trwałości produktu po 14 dniach' },
        { name: 'Badanie trwałości - 21 dni', category: 'TRWAŁOŚĆ', unit: null, frequency: 'przy nowym produkcie', description: 'Badanie trwałości produktu po 21 dniach' },
        // Smolistość (WWA)
        { name: 'Benzo(a)piren', category: 'SMOLISTOŚĆ', unit: 'µg/kg', normMax: 2.0, frequency: 'co pół roku', description: 'Zawartość benzo(a)pirenu w wyrobach wędzonych' },
        { name: 'Suma 4 WWA', category: 'SMOLISTOŚĆ', unit: 'µg/kg', normMax: 12.0, frequency: 'co pół roku', description: 'Suma 4 węglowodorów aromatycznych' },
        // Wymazy powierzchniowe
        { name: 'Wymaz z powierzchni roboczej', category: 'WYMAZY', unit: 'CFU/cm²', normMax: 10, frequency: 'co tydzień', description: 'Czystość powierzchni roboczych' },
        { name: 'Wymaz z rąk pracownika', category: 'WYMAZY', unit: 'CFU/cm²', normMax: 100, frequency: 'co tydzień', description: 'Higiena rąk pracowników' },
        { name: 'Wymaz ze sprzętu', category: 'WYMAZY', unit: 'CFU/cm²', normMax: 10, frequency: 'co tydzień', description: 'Czystość sprzętu produkcyjnego' },
      ],
    });
  }
  console.log('✅ Typy badań laboratoryjnych utworzone');

  // ============================================
  // TYPY ODPADÓW
  // ============================================
  const wasteTypesCount = await prisma.wasteType.count();
  if (wasteTypesCount === 0) {
    await prisma.wasteType.createMany({
      data: [
        // Kategoria 3 - odpady porozbiorowe
        { name: 'Kości', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Kości z rozbioru mięsa' },
        { name: 'Tłuszcz techniczny', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Tłuszcz nieprzeznaczony do spożycia' },
        { name: 'Ścięgna i chrząstki', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Tkanka łączna' },
        { name: 'Skóry wieprzowe', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Skóry z rozbioru' },
        { name: 'Odpady poprodukcyjne', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Odpady z produkcji wędlin' },
        { name: 'Przeterminowane produkty', category: 'KATEGORIA_3', code: '02 02 02', unit: 'kg', description: 'Produkty po terminie przydatności' },
        // Kategoria 2
        { name: 'Treść przewodu pokarmowego', category: 'KATEGORIA_2', code: '02 02 02', unit: 'kg', description: 'Treść żołądka i jelit' },
        // Kategoria 1 - SRM (zazwyczaj nie dotyczy masarni, ale na wszelki wypadek)
        { name: 'Materiał SRM', category: 'KATEGORIA_1', code: '02 01 02', unit: 'kg', description: 'Materiał szczególnego ryzyka (jeśli dotyczy)' },
      ],
    });
  }
  console.log('✅ Typy odpadów utworzone');

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

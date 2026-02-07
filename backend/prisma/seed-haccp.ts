import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 2 punkty kontrolne (CP) + 1 krytyczny punkt kontrolny (CCP) dla masarni
const ccps = [
  {
    name: 'CP1 - Przyjęcie surowców',
    description: 'Kontrola temperatury i stanu surowców mięsnych przy przyjęciu dostawy. Punkt kontrolny zapobiegający przyjęciu surowców niewłaściwie przechowywanych podczas transportu.',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Temperatura surowców mięsnych: max 4°C (świeże) lub max -18°C (mrożone). Temperatura pojazdu: max 4°C. Dokumenty HDI kompletne. Opakowania nieuszkodzone.',
    monitoringMethod: 'Pomiar temperatury surowca termometrem szpilkowym przy każdej dostawie. Kontrola wizualna stanu opakowań i pojazdu. Weryfikacja dokumentów HDI.',
    monitoringFrequency: 'Każda dostawa surowców mięsnych',
    correctiveAction: 'Odrzucenie dostawy przy przekroczeniu temperatury lub uszkodzonych opakowaniach. Powiadomienie dostawcy. Dokumentacja niezgodności. Ewentualna zmiana dostawcy przy powtarzających się problemach.',
    verificationMethod: 'Przegląd zapisów przyjęć raz w tygodniu. Kalibracja termometrów co 6 miesięcy. Audyt dostawców raz w roku.',
    recordKeeping: 'Rejestr przyjęć surowców (data, dostawca, temperatura, HDI, status zgodności). Protokoły odrzuceń. Karty kalibracji termometrów.',
  },
  {
    name: 'CP2 - Temperatura przechowywania',
    description: 'Monitoring temperatury w chłodniach i mroźniach. Punkt kontrolny zapobiegający namnażaniu się drobnoustrojów chorobotwórczych podczas przechowywania surowców i produktów.',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Chłodnie: 0°C do +4°C. Mroźnie: poniżej -18°C. Komora dojrzewania: zgodnie z recepturą (zwykle 10-15°C). Maksymalny czas przechowywania zgodny z datą przydatności.',
    monitoringMethod: 'Ciągły monitoring temperatury za pomocą rejestratorów elektronicznych. Kontrola wizualna termometrów. Codzienny odczyt i zapis temperatur.',
    monitoringFrequency: 'Ciągły monitoring automatyczny. Ręczny odczyt minimum 2x dziennie (rano i wieczorem).',
    correctiveAction: 'Przy przekroczeniu temperatury: ocena organoleptyczna produktów, przeniesienie do sprawnej chłodni, naprawa urządzenia. Przy długotrwałym przekroczeniu: utylizacja produktów. Powiadomienie serwisu.',
    verificationMethod: 'Analiza trendów temperatury co tydzień. Kalibracja czujników co 6 miesięcy. Przegląd techniczny urządzeń chłodniczych co rok.',
    recordKeeping: 'Zapisy ciągłe z rejestratorów temperatury. Dziennik odczytów temperatury. Protokoły awarii i napraw. Karty kalibracji czujników.',
  },
  {
    name: 'CCP1 - Obróbka termiczna',
    description: 'Kontrola temperatury i czasu obróbki termicznej (gotowanie, wędzenie, parzenie). Krytyczny punkt kontrolny eliminujący drobnoustroje chorobotwórcze w produktach mięsnych.',
    hazardType: 'BIOLOGICAL',
    criticalLimit: 'Temperatura wewnętrzna produktu: min 72°C przez min 2 minuty (parzenie/gotowanie). Wędzenie na gorąco: min 68°C wewnątrz przez 15 minut. Schładzanie: z 60°C do 10°C w max 6 godzin.',
    monitoringMethod: 'Pomiar temperatury wewnętrznej produktu termometrem szpilkowym. Kontrola temperatury i czasu w komorze wędzarniczej/kotłach. Rejestracja parametrów procesu.',
    monitoringFrequency: 'Każda partia produkcyjna. Pomiar w najgrubszym miejscu produktu.',
    correctiveAction: 'Przedłużenie czasu obróbki do osiągnięcia wymaganej temperatury. Powtórzenie procesu termicznego. Przy braku możliwości poprawy - utylizacja partii. Przegląd urządzenia.',
    verificationMethod: 'Badania mikrobiologiczne produktów gotowych (min. raz w miesiącu). Kalibracja termometrów co 6 miesięcy. Walidacja procesów termicznych raz w roku.',
    recordKeeping: 'Karty procesów termicznych (partia, temperatura, czas, podpis). Wyniki badań mikrobiologicznych. Protokoły walidacji procesów.',
  },
];

// Zagrożenia dla masarni
const hazards = [
  // Zagrożenia biologiczne
  {
    name: 'Salmonella spp.',
    type: 'BIOLOGICAL',
    source: 'Surowce mięsne, zanieczyszczenie krzyżowe, personel',
    preventiveMeasure: 'Kontrola temperatury, higiena personelu, separacja surowców od produktów gotowych',
    significance: 'HIGH',
    processStep: 'Przyjęcie surowców, przechowywanie, produkcja',
  },
  {
    name: 'Listeria monocytogenes',
    type: 'BIOLOGICAL',
    source: 'Środowisko produkcyjne, surowce, zanieczyszczenie wtórne',
    preventiveMeasure: 'Mycie i dezynfekcja, kontrola temperatury, obróbka termiczna',
    significance: 'HIGH',
    processStep: 'Przechowywanie, pakowanie, ekspedycja',
  },
  {
    name: 'E. coli O157:H7',
    type: 'BIOLOGICAL',
    source: 'Surowce mięsne (szczególnie wołowina), zanieczyszczenie fekalne',
    preventiveMeasure: 'Kontrola dostawców, obróbka termiczna, higiena produkcji',
    significance: 'HIGH',
    processStep: 'Przyjęcie surowców, obróbka termiczna',
  },
  {
    name: 'Clostridium botulinum',
    type: 'BIOLOGICAL',
    source: 'Warunki beztlenowe w produktach pakowanych próżniowo',
    preventiveMeasure: 'Kontrola temperatury przechowywania, właściwe stężenie soli peklującej',
    significance: 'HIGH',
    processStep: 'Peklowanie, pakowanie próżniowe',
  },
  {
    name: 'Campylobacter spp.',
    type: 'BIOLOGICAL',
    source: 'Surowe mięso drobiowe, zanieczyszczenie krzyżowe',
    preventiveMeasure: 'Separacja mięsa drobiowego, obróbka termiczna, higiena',
    significance: 'MEDIUM',
    processStep: 'Przyjęcie surowców, produkcja',
  },
  {
    name: 'Staphylococcus aureus',
    type: 'BIOLOGICAL',
    source: 'Personel (skóra, nos, gardło), nieprawidłowa temperatura',
    preventiveMeasure: 'Higiena personelu, kontrola temperatury, szkolenia',
    significance: 'MEDIUM',
    processStep: 'Wszystkie etapy produkcji',
  },
  // Zagrożenia chemiczne
  {
    name: 'Pozostałości antybiotyków',
    type: 'CHEMICAL',
    source: 'Surowce od dostawców nieprzestrzegających okresów karencji',
    preventiveMeasure: 'Kwalifikacja dostawców, certyfikaty, badania surowców',
    significance: 'MEDIUM',
    processStep: 'Przyjęcie surowców',
  },
  {
    name: 'Środki myjące i dezynfekujące',
    type: 'CHEMICAL',
    source: 'Nieprawidłowe płukanie po myciu, przechowywanie w strefie produkcji',
    preventiveMeasure: 'Procedury mycia, szkolenia, oddzielne przechowywanie chemii',
    significance: 'MEDIUM',
    processStep: 'Po myciu urządzeń i pomieszczeń',
  },
  {
    name: 'Azotyny/azotany (nadmierne)',
    type: 'CHEMICAL',
    source: 'Nieprawidłowe dozowanie soli peklującej',
    preventiveMeasure: 'Precyzyjne ważenie, receptury, szkolenia',
    significance: 'MEDIUM',
    processStep: 'Peklowanie',
  },
  {
    name: 'WWA (węglowodory aromatyczne)',
    type: 'CHEMICAL',
    source: 'Niewłaściwe drewno do wędzenia, zbyt wysoka temperatura',
    preventiveMeasure: 'Używanie odpowiedniego drewna, kontrola temperatury wędzenia',
    significance: 'MEDIUM',
    processStep: 'Wędzenie',
  },
  {
    name: 'Alergeny (deklarowane)',
    type: 'CHEMICAL',
    source: 'Składniki receptury, zanieczyszczenie krzyżowe',
    preventiveMeasure: 'Zarządzanie alergenami, etykietowanie, separacja produkcji',
    significance: 'HIGH',
    processStep: 'Produkcja, pakowanie, etykietowanie',
  },
  // Zagrożenia fizyczne
  {
    name: 'Fragmenty kości',
    type: 'PHYSICAL',
    source: 'Surowce mięsne, proces wykrawania',
    preventiveMeasure: 'Kontrola wizualna, wykrywacze metalu, szkolenia',
    significance: 'MEDIUM',
    processStep: 'Wykrawanie, produkcja',
  },
  {
    name: 'Fragmenty metalu',
    type: 'PHYSICAL',
    source: 'Uszkodzone noże, maszyny, druty',
    preventiveMeasure: 'Przegląd narzędzi, wykrywacze metalu, konserwacja maszyn',
    significance: 'MEDIUM',
    processStep: 'Wszystkie etapy produkcji',
  },
  {
    name: 'Fragmenty plastiku',
    type: 'PHYSICAL',
    source: 'Uszkodzone pojemniki, opakowania, rękawice',
    preventiveMeasure: 'Kontrola wizualna, wymiana uszkodzonych pojemników',
    significance: 'LOW',
    processStep: 'Produkcja, pakowanie',
  },
  {
    name: 'Ciała obce (szkło, drewno)',
    type: 'PHYSICAL',
    source: 'Uszkodzone osłony lamp, palety drewniane',
    preventiveMeasure: 'Osłony lamp odporne na stłuczenie, palety plastikowe w strefie produkcji',
    significance: 'LOW',
    processStep: 'Wszystkie etapy',
  },
];

// Punkty pomiaru temperatury powiązane z CCP
const temperaturePoints = [
  // CCP1 - Przyjęcie
  { name: 'Temperatura dostawy - mięso świeże', location: 'Rampa przyjęć', type: 'Przyjęcie', minTemp: -2, maxTemp: 4, ccpIndex: 0 },
  { name: 'Temperatura dostawy - mięso mrożone', location: 'Rampa przyjęć', type: 'Przyjęcie', minTemp: -25, maxTemp: -18, ccpIndex: 0 },
  { name: 'Temperatura pojazdu dostawczego', location: 'Rampa przyjęć', type: 'Pojazd', minTemp: -2, maxTemp: 4, ccpIndex: 0 },
  // CCP2 - Przechowywanie
  { name: 'Chłodnia surowców', location: 'Magazyn', type: 'Chłodnia', minTemp: 0, maxTemp: 4, ccpIndex: 1 },
  { name: 'Chłodnia produktów gotowych', location: 'Magazyn', type: 'Chłodnia', minTemp: 0, maxTemp: 4, ccpIndex: 1 },
  { name: 'Mroźnia', location: 'Magazyn', type: 'Mroźnia', minTemp: -25, maxTemp: -18, ccpIndex: 1 },
  { name: 'Komora dojrzewania', location: 'Produkcja', type: 'Komora', minTemp: 10, maxTemp: 15, ccpIndex: 1 },
  { name: 'Chłodnia ekspedycji', location: 'Ekspedycja', type: 'Chłodnia', minTemp: 0, maxTemp: 4, ccpIndex: 1 },
];

async function main() {
  console.log('🍖 Seedowanie planu HACCP dla masarni...\n');

  // Dodaj CCP
  console.log('📋 Dodawanie CCP (Krytycznych Punktów Kontrolnych)...');
  const createdCCPs: any[] = [];
  for (const ccp of ccps) {
    const existing = await prisma.cCP.findFirst({
      where: { name: ccp.name },
    });

    if (!existing) {
      const created = await prisma.cCP.create({ data: ccp });
      createdCCPs.push(created);
      console.log(`  ✅ ${ccp.name}`);
    } else {
      await prisma.cCP.update({
        where: { id: existing.id },
        data: ccp,
      });
      createdCCPs.push(existing);
      console.log(`  🔄 Zaktualizowano: ${ccp.name}`);
    }
  }

  // Dodaj zagrożenia
  console.log('\n⚠️ Dodawanie analizy zagrożeń...');
  for (const hazard of hazards) {
    const existing = await prisma.hazard.findFirst({
      where: { name: hazard.name },
    });

    if (!existing) {
      await prisma.hazard.create({ data: hazard });
      console.log(`  ✅ ${hazard.name} (${hazard.type})`);
    } else {
      await prisma.hazard.update({
        where: { id: existing.id },
        data: hazard,
      });
      console.log(`  🔄 ${hazard.name}`);
    }
  }

  // Dodaj punkty pomiaru temperatury
  console.log('\n🌡️ Dodawanie punktów pomiaru temperatury...');
  for (const point of temperaturePoints) {
    const ccpId = createdCCPs[point.ccpIndex]?.id;
    const existing = await prisma.temperaturePoint.findFirst({
      where: { name: point.name },
    });

    if (!existing) {
      await prisma.temperaturePoint.create({
        data: {
          name: point.name,
          location: point.location,
          type: point.type,
          minTemp: point.minTemp,
          maxTemp: point.maxTemp,
          ccpId: ccpId,
        },
      });
      console.log(`  ✅ ${point.name} (${point.minTemp}°C - ${point.maxTemp}°C)`);
    } else {
      await prisma.temperaturePoint.update({
        where: { id: existing.id },
        data: {
          location: point.location,
          type: point.type,
          minTemp: point.minTemp,
          maxTemp: point.maxTemp,
          ccpId: ccpId,
        },
      });
      console.log(`  🔄 ${point.name}`);
    }
  }

  console.log('\n✨ Seedowanie zakończone!');
  console.log(`   - ${ccps.length} CCP`);
  console.log(`   - ${hazards.length} zagrożeń`);
  console.log(`   - ${temperaturePoints.length} punktów pomiaru temperatury`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

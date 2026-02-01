import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const auditChecklists = [
  {
    name: 'Audyt higieniczny - Hala produkcyjna',
    category: 'Higiena',
    items: JSON.stringify([
      { item: 'Podłogi są czyste i suche' },
      { item: 'Ściany i sufity bez zanieczyszczeń' },
      { item: 'Kratki ściekowe są czyste i drożne' },
      { item: 'Oświetlenie jest wystarczające i osłonięte' },
      { item: 'Wentylacja działa prawidłowo' },
      { item: 'Temperatura w hali zgodna z wymaganiami' },
      { item: 'Stoły i powierzchnie robocze są czyste' },
      { item: 'Sprzęt i narzędzia są czyste i zdezynfekowane' },
      { item: 'Brak obecności szkodników lub śladów ich obecności' },
      { item: 'Pojemniki na odpady są zamknięte i oznakowane' },
      { item: 'Środki czystości przechowywane w wyznaczonym miejscu' },
      { item: 'Drzwi i okna zabezpieczone przed szkodnikami' },
    ]),
  },
  {
    name: 'Audyt higieniczny - Chłodnie',
    category: 'Higiena',
    items: JSON.stringify([
      { item: 'Temperatura w chłodni zgodna z normą (0-4°C)' },
      { item: 'Termometr działa prawidłowo i jest skalibrowany' },
      { item: 'Podłogi, ściany i sufity są czyste' },
      { item: 'Produkty są prawidłowo rozmieszczone (nie stykają się z podłogą)' },
      { item: 'Produkty są właściwie oznakowane (data, partia)' },
      { item: 'Zasada FIFO jest przestrzegana' },
      { item: 'Brak produktów przeterminowanych' },
      { item: 'Drzwi chłodni zamykają się szczelnie' },
      { item: 'Brak nadmiernego szronu lub lodu' },
      { item: 'Oświetlenie jest sprawne' },
    ]),
  },
  {
    name: 'Audyt higieniczny - Mroźnie',
    category: 'Higiena',
    items: JSON.stringify([
      { item: 'Temperatura w mroźni zgodna z normą (poniżej -18°C)' },
      { item: 'Termometr działa prawidłowo i jest skalibrowany' },
      { item: 'Produkty są prawidłowo pakowane i zabezpieczone' },
      { item: 'Produkty są właściwie oznakowane (data zamrożenia, partia)' },
      { item: 'Brak produktów przeterminowanych' },
      { item: 'Brak nadmiernego szronu lub lodu na produktach' },
      { item: 'Drzwi mroźni zamykają się szczelnie' },
      { item: 'Alarm temperatury jest sprawny' },
    ]),
  },
  {
    name: 'Audyt higieniczny - Higiena personelu',
    category: 'Higiena',
    items: JSON.stringify([
      { item: 'Pracownicy noszą czyste fartuchy/odzież ochronną' },
      { item: 'Pracownicy noszą czepki/siatki na włosy' },
      { item: 'Pracownicy noszą rękawiczki (gdy wymagane)' },
      { item: 'Pracownicy noszą czyste obuwie robocze' },
      { item: 'Biżuteria i zegarki nie są noszone podczas pracy' },
      { item: 'Paznokcie są krótkie i czyste, bez lakieru' },
      { item: 'Ręce są myte przed rozpoczęciem pracy' },
      { item: 'Ręce są myte po każdym wyjściu z hali' },
      { item: 'Ręce są myte po kontakcie z surowcem' },
      { item: 'Pracownicy nie jedzą/piją na hali produkcyjnej' },
      { item: 'Pracownicy nie palą tytoniu na terenie zakładu' },
      { item: 'Pracownicy zgłaszają choroby i urazy' },
    ]),
  },
  {
    name: 'Audyt HACCP - Dokumentacja',
    category: 'HACCP',
    items: JSON.stringify([
      { item: 'Plan HACCP jest aktualny i dostępny' },
      { item: 'Analiza zagrożeń jest przeprowadzona dla wszystkich etapów' },
      { item: 'CCP są prawidłowo zidentyfikowane' },
      { item: 'Limity krytyczne są określone dla każdego CCP' },
      { item: 'Procedury monitorowania są udokumentowane' },
      { item: 'Działania korygujące są udokumentowane' },
      { item: 'Procedury weryfikacji są określone' },
      { item: 'Zapisy są prowadzone prawidłowo i czytelnie' },
      { item: 'Zapisy są przechowywane przez wymagany okres' },
      { item: 'Diagram przepływu jest aktualny' },
      { item: 'Opis produktu jest kompletny' },
      { item: 'Zespół HACCP jest powołany i przeszkolony' },
    ]),
  },
  {
    name: 'Audyt HACCP - Monitoring CCP',
    category: 'HACCP',
    items: JSON.stringify([
      { item: 'Temperatura przyjęcia surowców jest kontrolowana' },
      { item: 'Temperatura przechowywania jest monitorowana' },
      { item: 'Temperatura obróbki cieplnej jest kontrolowana' },
      { item: 'Czas obróbki cieplnej jest kontrolowany' },
      { item: 'Zapisy z monitoringu są kompletne' },
      { item: 'Przekroczenia limitów są odnotowywane' },
      { item: 'Działania korygujące są podejmowane w przypadku odchyleń' },
      { item: 'Urządzenia pomiarowe są kalibrowane' },
      { item: 'Częstotliwość monitoringu jest przestrzegana' },
      { item: 'Osoby odpowiedzialne za monitoring są przeszkolone' },
    ]),
  },
  {
    name: 'Audyt HACCP - Przyjęcie surowców',
    category: 'HACCP',
    items: JSON.stringify([
      { item: 'Temperatura surowców jest kontrolowana przy przyjęciu' },
      { item: 'Dokumenty towarzyszące są sprawdzane (HDI, świadectwa)' },
      { item: 'Stan opakowań jest oceniany' },
      { item: 'Cechy organoleptyczne surowców są sprawdzane' },
      { item: 'Surowce są prawidłowo oznakowane' },
      { item: 'Surowce są szybko przenoszone do magazynu' },
      { item: 'Dostawcy są zatwierdzeni i oceniani' },
      { item: 'Specyfikacje surowców są dostępne' },
      { item: 'Protokoły niezgodności są prowadzone' },
      { item: 'Pojazdy dostawcze są czyste i chłodzone' },
    ]),
  },
  {
    name: 'Audyt - Traceability (Identyfikowalność)',
    category: 'HACCP',
    items: JSON.stringify([
      { item: 'System identyfikowalności jest wdrożony' },
      { item: 'Partie produkcyjne są oznaczone' },
      { item: 'Możliwe jest prześledzenie surowców do dostawcy' },
      { item: 'Możliwe jest prześledzenie produktu do odbiorcy' },
      { item: 'Testy identyfikowalności są przeprowadzane' },
      { item: 'Wyniki testów identyfikowalności są dokumentowane' },
      { item: 'Czas przeprowadzenia testu jest zgodny z wymaganiami (max 4h)' },
      { item: 'Procedura wycofania produktu jest udokumentowana' },
      { item: 'Dane kontaktowe odbiorców są aktualne' },
      { item: 'System etykietowania jest spójny' },
    ]),
  },
  {
    name: 'Audyt - Kontrola szkodników (DDD)',
    category: 'DDD',
    items: JSON.stringify([
      { item: 'Umowa z firmą DDD jest aktualna' },
      { item: 'Mapa rozmieszczenia pułapek jest aktualna' },
      { item: 'Pułapki są sprawne i prawidłowo oznakowane' },
      { item: 'Protokoły z kontroli DDD są dostępne' },
      { item: 'Brak śladów obecności gryzoni' },
      { item: 'Brak śladów obecności owadów' },
      { item: 'Otwory i szczeliny są uszczelnione' },
      { item: 'Drzwi zewnętrzne są szczelne' },
      { item: 'Okna są zabezpieczone siatkami' },
      { item: 'Odpady są usuwane regularnie' },
      { item: 'Teren wokół budynku jest czysty' },
      { item: 'Karty charakterystyki środków DDD są dostępne' },
    ]),
  },
  {
    name: 'Audyt - Szkolenia pracowników',
    category: 'Szkolenia',
    items: JSON.stringify([
      { item: 'Plan szkoleń jest opracowany i aktualny' },
      { item: 'Szkolenia wstępne są przeprowadzane dla nowych pracowników' },
      { item: 'Szkolenia okresowe są realizowane zgodnie z planem' },
      { item: 'Szkolenia z higieny są przeprowadzane' },
      { item: 'Szkolenia z HACCP są przeprowadzane' },
      { item: 'Szkolenia BHP są aktualne' },
      { item: 'Szkolenia z alergenów są przeprowadzane' },
      { item: 'Zaświadczenia ze szkoleń są przechowywane' },
      { item: 'Listy obecności ze szkoleń są prowadzone' },
      { item: 'Efektywność szkoleń jest weryfikowana' },
      { item: 'Pracownicy znają swoje obowiązki związane z HACCP' },
    ]),
  },
  {
    name: 'Audyt - Mycie i dezynfekcja',
    category: 'Higiena',
    items: JSON.stringify([
      { item: 'Harmonogram mycia i dezynfekcji jest opracowany' },
      { item: 'Procedury mycia są udokumentowane' },
      { item: 'Środki myjące są zatwierdzone do kontaktu z żywnością' },
      { item: 'Środki dezynfekujące są zatwierdzone' },
      { item: 'Stężenie środków jest prawidłowe' },
      { item: 'Czas działania środków jest przestrzegany' },
      { item: 'Temperatura wody jest odpowiednia' },
      { item: 'Powierzchnie są dokładnie spłukiwane' },
      { item: 'Zapisy z mycia są prowadzone' },
      { item: 'Skuteczność mycia jest weryfikowana (wymazy, ATP)' },
      { item: 'Sprzęt do mycia jest czysty i w dobrym stanie' },
      { item: 'Karty charakterystyki środków są dostępne' },
    ]),
  },
  {
    name: 'Audyt - Konserwacja i utrzymanie ruchu',
    category: 'Infrastruktura',
    items: JSON.stringify([
      { item: 'Plan konserwacji maszyn jest opracowany' },
      { item: 'Przeglądy techniczne są wykonywane zgodnie z planem' },
      { item: 'Maszyny są w dobrym stanie technicznym' },
      { item: 'Uszkodzenia są szybko naprawiane' },
      { item: 'Smary i oleje są dopuszczone do kontaktu z żywnością' },
      { item: 'Narzędzia są kompletne i w dobrym stanie' },
      { item: 'Zapisy z konserwacji są prowadzone' },
      { item: 'Budynek jest w dobrym stanie technicznym' },
      { item: 'Instalacja elektryczna jest sprawna' },
      { item: 'Instalacja wodna jest sprawna' },
      { item: 'Instalacja kanalizacyjna jest drożna' },
    ]),
  },
  {
    name: 'Audyt - Magazynowanie',
    category: 'Magazyn',
    items: JSON.stringify([
      { item: 'Magazyny są czyste i uporządkowane' },
      { item: 'Produkty są przechowywane na regałach/paletach' },
      { item: 'Produkty nie stykają się z podłogą' },
      { item: 'Produkty są oddzielone od ścian (min. 5 cm)' },
      { item: 'Surowce i produkty gotowe są rozdzielone' },
      { item: 'Produkty alergenne są oznakowane i oddzielone' },
      { item: 'Środki chemiczne są przechowywane oddzielnie' },
      { item: 'Opakowania są przechowywane w czystym miejscu' },
      { item: 'Zasada FIFO jest przestrzegana' },
      { item: 'Daty przydatności są kontrolowane' },
      { item: 'Warunki magazynowania są odpowiednie (T, wilgotność)' },
    ]),
  },
  {
    name: 'Audyt - Alergeny',
    category: 'Bezpieczeństwo',
    items: JSON.stringify([
      { item: 'Lista alergenów jest opracowana' },
      { item: 'Alergeny są zidentyfikowane w recepturach' },
      { item: 'Surowce alergenne są prawidłowo oznakowane' },
      { item: 'Produkty alergenne są przechowywane oddzielnie' },
      { item: 'Kolejność produkcji minimalizuje ryzyko krzyżowego zanieczyszczenia' },
      { item: 'Mycie między produkcjami alergennych jest przeprowadzane' },
      { item: 'Etykiety produktów zawierają informacje o alergenach' },
      { item: 'Pracownicy są przeszkoleni z zakresu alergenów' },
      { item: 'Procedura zarządzania alergenami jest wdrożona' },
      { item: 'Deklaracja "może zawierać" jest stosowana prawidłowo' },
    ]),
  },
  {
    name: 'Audyt - Peklowanie',
    category: 'Produkcja',
    items: JSON.stringify([
      { item: 'Receptury peklowania są udokumentowane' },
      { item: 'Stężenie solanki jest kontrolowane (areometr)' },
      { item: 'Temperatura peklowania jest monitorowana (2-6°C)' },
      { item: 'Czas peklowania jest przestrzegany' },
      { item: 'Partie peklownicze są oznakowane' },
      { item: 'Surowce do peklowania są odpowiednio przygotowane' },
      { item: 'Naczynia do peklowania są czyste' },
      { item: 'Zapisy z procesu peklowania są prowadzone' },
      { item: 'Gotowe produkty są prawidłowo przechowywane' },
      { item: 'FIFO jest przestrzegane' },
    ]),
  },
  {
    name: 'Audyt - Wędzenie',
    category: 'Produkcja',
    items: JSON.stringify([
      { item: 'Wędzarnie są czyste przed użyciem' },
      { item: 'Drewno do wędzenia jest odpowiednie (gatunki)' },
      { item: 'Drewno jest suche i wolne od zanieczyszczeń' },
      { item: 'Temperatura wędzenia jest monitorowana' },
      { item: 'Czas wędzenia jest kontrolowany' },
      { item: 'Produkty są prawidłowo rozmieszczone w wędzarni' },
      { item: 'Zapisy z procesu wędzenia są prowadzone' },
      { item: 'Wędzarnie są prawidłowo wentylowane' },
      { item: 'Produkty po wędzeniu są schładzane prawidłowo' },
      { item: 'Czujniki temperatury są kalibrowane' },
    ]),
  },
];

async function main() {
  console.log('Seeding audit checklists...');

  // Najpierw usuń istniejące listy kontrolne (opcjonalnie)
  // await prisma.auditChecklist.deleteMany({});

  for (const checklist of auditChecklists) {
    const existing = await prisma.auditChecklist.findFirst({
      where: { name: checklist.name },
    });

    if (!existing) {
      await prisma.auditChecklist.create({
        data: checklist,
      });
      console.log(`Created checklist: ${checklist.name}`);
    } else {
      // Aktualizuj istniejącą listę
      await prisma.auditChecklist.update({
        where: { id: existing.id },
        data: {
          items: checklist.items,
          isActive: true,
        },
      });
      console.log(`Updated checklist: ${checklist.name}`);
    }
  }

  console.log('Seeding completed!');
  console.log(`Total checklists: ${auditChecklists.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

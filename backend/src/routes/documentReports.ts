import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

dayjs.locale('pl');

const router = Router();
const prisma = new PrismaClient();

// Helper - nagłówek dokumentu
const getDocumentHeader = (title: string) => `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @media print {
            body { margin: 0; padding: 10mm; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 297mm;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .company-name { font-size: 16px; font-weight: bold; }
        .doc-title { font-size: 14px; font-weight: bold; margin: 15px 0; background: #f0f0f0; padding: 8px; text-align: center; }
        .doc-info { font-size: 10px; color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 11px; }
        th { background-color: #e0e0e0; font-weight: bold; }
        .badge-ok { background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 3px; }
        .badge-fail { background: #f8d7da; color: #721c24; padding: 2px 6px; border-radius: 3px; }
        .badge-warning { background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 3px; }
        .signature-section { margin-top: 30px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 10px; }
        .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; }
        .print-btn:hover { background: #0056b3; }
        .summary-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .temp-ok { color: #155724; }
        .temp-warning { color: #856404; }
        .temp-danger { color: #721c24; font-weight: bold; }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Drukuj</button>
    <div class="header">
        <div class="company-name">MASARNIA MLO</div>
        <div>System HACCP - Dokumentacja</div>
    </div>
`;

const getDocumentFooter = () => `
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">Data i podpis sporządzającego</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Podpis osoby odpowiedzialnej za HACCP</div>
        </div>
    </div>
    <div style="margin-top: 20px; font-size: 9px; color: #666; text-align: center;">
        Dokument wygenerowany automatycznie z systemu HACCP | ${dayjs().format('DD.MM.YYYY HH:mm')}
    </div>
</body>
</html>
`;

// ============================================
// RAPORT PRZYJĘĆ SUROWCÓW
// ============================================
router.get('/receptions', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const where: any = {};
    if (startDate) where.receivedAt = { ...where.receivedAt, gte: new Date(startDate as string) };
    if (endDate) where.receivedAt = { ...where.receivedAt, lte: new Date(endDate as string) };

    const receptions = await prisma.rawMaterialReception.findMany({
      where,
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: parseInt(limit as string),
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : 'Wszystkie';

    let html = getDocumentHeader('Rejestr przyjęć surowców');
    html += `
      <div class="doc-title">REJESTR PRZYJĘĆ SUROWCÓW MIĘSNYCH</div>
      <div class="doc-info">Okres: ${dateRange} | Liczba zapisów: ${receptions.length}</div>
      
      <div class="summary-box">
        <strong>Podsumowanie:</strong><br>
        Łączna liczba przyjęć: ${receptions.length}<br>
        Zgodne: ${receptions.filter((r: any) => r.isCompliant).length}<br>
        Niezgodne: ${receptions.filter((r: any) => !r.isCompliant).length}
      </div>

      <table>
        <thead>
          <tr>
            <th>Data/Godz.</th>
            <th>Surowiec</th>
            <th>Dostawca</th>
            <th>Nr partii</th>
            <th>Ilość</th>
            <th>Temp.</th>
            <th>Ocena</th>
            <th>Przyjął</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const r of receptions) {
      const tempClass = r.temperature && r.temperature > 7 ? 'temp-danger' : 'temp-ok';
      html += `
        <tr>
          <td>${dayjs(r.receivedAt).format('DD.MM.YYYY')}<br><small>${r.receivedTime || dayjs(r.receivedAt).format('HH:mm')}</small></td>
          <td>${r.rawMaterial?.name || '-'}</td>
          <td>${r.supplier?.name || '-'}</td>
          <td>${r.batchNumber || '-'}</td>
          <td>${r.quantity} ${r.unit}</td>
          <td class="${tempClass}">${r.temperature ? r.temperature + '°C' : '-'}</td>
          <td>${r.isCompliant 
            ? '<span class="badge-ok">✓ Zgodne</span>' 
            : '<span class="badge-fail">✗ Niezgodne</span>'}</td>
          <td>${r.user?.name || '-'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;
    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu przyjęć:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// RAPORT KONTROLI TEMPERATURY
// ============================================
router.get('/temperature', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, pointId } = req.query;
    
    const where: any = {};
    if (startDate) where.readAt = { ...where.readAt, gte: new Date(startDate as string) };
    if (endDate) where.readAt = { ...where.readAt, lte: new Date(endDate as string) };
    if (pointId) where.temperaturePointId = parseInt(pointId as string);

    const readings = await prisma.temperatureReading.findMany({
      where,
      include: {
        temperaturePoint: true,
        user: { select: { name: true } },
      },
      orderBy: { readAt: 'desc' },
      take: 200,
    });

    const points = await prisma.temperaturePoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : dayjs().format('MMMM YYYY');

    // Grupuj odczyty po dniu i punkcie
    const byDay: Record<string, Record<string, any[]>> = {};
    for (const r of readings) {
      const day = dayjs(r.readAt).format('YYYY-MM-DD');
      const pointName = r.temperaturePoint?.name || 'Nieznany';
      if (!byDay[day]) byDay[day] = {};
      if (!byDay[day][pointName]) byDay[day][pointName] = [];
      byDay[day][pointName].push(r);
    }

    let html = getDocumentHeader('Rejestr kontroli temperatury');
    html += `
      <div class="doc-title">REJESTR KONTROLI TEMPERATURY - CCP</div>
      <div class="doc-info">Okres: ${dateRange} | Punkty pomiarowe: ${points.length}</div>
      
      <div class="summary-box">
        <strong>Punkty pomiarowe i normy:</strong><br>
        ${points.map((p: any) => `${p.name}: ${p.minTemp}°C do ${p.maxTemp}°C`).join(' | ')}
      </div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Godzina</th>
            <th>Punkt pomiarowy</th>
            <th>Temperatura</th>
            <th>Norma</th>
            <th>Status</th>
            <th>Kontrolujący</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const r of readings) {
      const point = r.temperaturePoint;
      const isOk = point && r.temperature >= point.minTemp && r.temperature <= point.maxTemp;
      const tempClass = isOk ? 'temp-ok' : 'temp-danger';
      
      html += `
        <tr>
          <td>${dayjs(r.readAt).format('DD.MM.YYYY')}</td>
          <td>${dayjs(r.readAt).format('HH:mm')}</td>
          <td>${point?.name || '-'}</td>
          <td class="${tempClass}"><strong>${r.temperature}°C</strong></td>
          <td>${point ? `${point.minTemp} - ${point.maxTemp}°C` : '-'}</td>
          <td>${isOk 
            ? '<span class="badge-ok">✓ OK</span>' 
            : '<span class="badge-fail">⚠ PRZEKROCZENIE</span>'}</td>
          <td>${r.user?.name || '-'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;

    // Podsumowanie przekroczeń
    const violations = readings.filter((r: any) => {
      const point = r.temperaturePoint;
      return point && (r.temperature < point.minTemp || r.temperature > point.maxTemp);
    });

    if (violations.length > 0) {
      html += `
        <div style="background: #f8d7da; border: 2px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <strong>⚠️ UWAGA - Zarejestrowano ${violations.length} przekroczeń norm temperatury!</strong><br>
          <small>Każde przekroczenie wymaga podjęcia działań korygujących zgodnie z procedurą.</small>
        </div>
      `;
    }

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu temperatury:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// RAPORT PEKLOWANIA
// ============================================
router.get('/curing', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const where: any = {};
    if (startDate) where.startDate = { ...where.startDate, gte: new Date(startDate as string) };
    if (endDate) where.startDate = { ...where.startDate, lte: new Date(endDate as string) };

    const batches = await prisma.curingBatch.findMany({
      where,
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          }
        },
        user: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
      take: parseInt(limit as string),
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : 'Wszystkie';

    let html = getDocumentHeader('Rejestr peklowania');
    html += `
      <div class="doc-title">REJESTR PARTII PEKLOWANIA</div>
      <div class="doc-info">Okres: ${dateRange} | Liczba partii: ${batches.length}</div>

      <table>
        <thead>
          <tr>
            <th>Nr partii</th>
            <th>Produkt</th>
            <th>Surowiec</th>
            <th>Dostawca</th>
            <th>Ilość</th>
            <th>Data rozp.</th>
            <th>Plan. zakoń.</th>
            <th>Status</th>
            <th>Operator</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const b of batches) {
      const statusBadge = b.status === 'COMPLETED' 
        ? '<span class="badge-ok">Zakończone</span>'
        : b.status === 'IN_PROGRESS' 
          ? '<span class="badge-warning">W trakcie</span>'
          : '<span class="badge-fail">Anulowane</span>';

      html += `
        <tr>
          <td><strong>${b.batchNumber}</strong></td>
          <td>${b.productName || '-'}</td>
          <td>${b.reception?.rawMaterial?.name || b.meatDescription || '-'}</td>
          <td>${b.reception?.supplier?.name || '-'}</td>
          <td>${b.quantity} ${b.unit}</td>
          <td>${dayjs(b.startDate).format('DD.MM.YYYY')}</td>
          <td>${b.plannedEndDate ? dayjs(b.plannedEndDate).format('DD.MM.YYYY') : '-'}</td>
          <td>${statusBadge}</td>
          <td>${b.user?.name || '-'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;
    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu peklowania:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// RAPORT PRODUKCJI
// ============================================
router.get('/production', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const where: any = {};
    if (startDate) where.productionDate = { ...where.productionDate, gte: new Date(startDate as string) };
    if (endDate) where.productionDate = { ...where.productionDate, lte: new Date(endDate as string) };

    const batches = await prisma.productionBatch.findMany({
      where,
      include: {
        product: true,
        user: { select: { name: true } },
      },
      orderBy: { productionDate: 'desc' },
      take: parseInt(limit as string),
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : 'Wszystkie';

    let html = getDocumentHeader('Rejestr produkcji');
    html += `
      <div class="doc-title">REJESTR PARTII PRODUKCJI</div>
      <div class="doc-info">Okres: ${dateRange} | Liczba partii: ${batches.length}</div>

      <table>
        <thead>
          <tr>
            <th>Nr partii</th>
            <th>Produkt</th>
            <th>Ilość</th>
            <th>Data prod.</th>
            <th>Ważność</th>
            <th>Status</th>
            <th>Operator</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const b of batches) {
      const statusBadge = b.status === 'COMPLETED' 
        ? '<span class="badge-ok">Zakończone</span>'
        : b.status === 'IN_PROGRESS' 
          ? '<span class="badge-warning">W trakcie</span>'
          : '<span class="badge-fail">Anulowane</span>';

      html += `
        <tr>
          <td><strong>${b.batchNumber}</strong></td>
          <td>${(b as any).product?.name || '-'}</td>
          <td>${b.quantity} ${b.unit}</td>
          <td>${dayjs(b.productionDate).format('DD.MM.YYYY')}</td>
          <td>${b.expiryDate ? dayjs(b.expiryDate).format('DD.MM.YYYY') : '-'}</td>
          <td>${statusBadge}</td>
          <td>${(b as any).user?.name || '-'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;
    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu produkcji:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// RAPORT CZYSZCZENIA
// ============================================
router.get('/cleaning', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const where: any = {};
    if (startDate) where.cleanedAt = { ...where.cleanedAt, gte: new Date(startDate as string) };
    if (endDate) where.cleanedAt = { ...where.cleanedAt, lte: new Date(endDate as string) };

    const records = await prisma.cleaningRecord.findMany({
      where,
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
      orderBy: { cleanedAt: 'desc' },
      take: parseInt(limit as string),
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : 'Wszystkie';

    let html = getDocumentHeader('Rejestr czyszczenia');
    html += `
      <div class="doc-title">REJESTR CZYSZCZENIA I DEZYNFEKCJI</div>
      <div class="doc-info">Okres: ${dateRange} | Liczba zapisów: ${records.length}</div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Godzina</th>
            <th>Strefa/Obszar</th>
            <th>Metoda</th>
            <th>Środki chemiczne</th>
            <th>Wykonał</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const r of records) {
      html += `
        <tr>
          <td>${dayjs(r.cleanedAt).format('DD.MM.YYYY')}</td>
          <td>${dayjs(r.cleanedAt).format('HH:mm')}</td>
          <td>${(r as any).cleaningArea?.name || '-'}</td>
          <td>${r.method || '-'}</td>
          <td>${r.chemicals || '-'}</td>
          <td>${(r as any).user?.name || '-'}</td>
          <td>${r.isVerified 
            ? '<span class="badge-ok">✓ Zweryfikowano</span>' 
            : '<span class="badge-warning">Oczekuje</span>'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;
    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu czyszczenia:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// RAPORT AUDYTÓW
// ============================================
router.get('/audits', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query;
    
    const where: any = {};
    if (startDate) where.auditDate = { ...where.auditDate, gte: new Date(startDate as string) };
    if (endDate) where.auditDate = { ...where.auditDate, lte: new Date(endDate as string) };

    const audits = await prisma.auditRecord.findMany({
      where,
      include: {
        user: { select: { name: true } },
        checklist: { select: { name: true, category: true } },
      },
      orderBy: { auditDate: 'desc' },
      take: parseInt(limit as string),
    });

    const dateRange = startDate && endDate 
      ? `${dayjs(startDate as string).format('DD.MM.YYYY')} - ${dayjs(endDate as string).format('DD.MM.YYYY')}`
      : 'Wszystkie';

    let html = getDocumentHeader('Rejestr audytów wewnętrznych');
    html += `
      <div class="doc-title">REJESTR AUDYTÓW WEWNĘTRZNYCH</div>
      <div class="doc-info">Okres: ${dateRange} | Liczba audytów: ${audits.length}</div>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Lista kontrolna</th>
            <th>Kategoria</th>
            <th>Audytor</th>
            <th>Wynik</th>
            <th>Ustalenia</th>
            <th>Zalecenia</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const a of audits) {
      const score = a.score ?? 0;
      const scoreClass = score >= 80 ? 'badge-ok' : score >= 60 ? 'badge-warning' : 'badge-fail';
      
      html += `
        <tr>
          <td>${dayjs(a.auditDate).format('DD.MM.YYYY')}</td>
          <td>${(a as any).checklist?.name || '-'}</td>
          <td>${(a as any).checklist?.category || '-'}</td>
          <td>${a.auditor || (a as any).user?.name || '-'}</td>
          <td><span class="${scoreClass}">${score}%</span></td>
          <td>${a.findings || '-'}</td>
          <td>${a.recommendations || '-'}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
    `;
    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu audytów:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// ============================================
// WZORCE FORMULARZY (PUSTE DO RĘCZNEGO WYPEŁNIENIA)
// ============================================

// Pusty wzorzec - nagłówek
const getTemplateHeader = (title: string, docNumber: string) => `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @media print {
            body { margin: 0; padding: 8mm; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
        }
        body {
            font-family: Arial, sans-serif;
            max-width: 297mm;
            margin: 0 auto;
            padding: 15px;
            font-size: 11px;
        }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .header-table td { border: 1px solid #000; padding: 5px; }
        .header-table .logo { width: 20%; text-align: center; font-weight: bold; font-size: 14px; }
        .header-table .title { width: 60%; text-align: center; font-weight: bold; font-size: 13px; }
        .header-table .doc-info { width: 20%; font-size: 9px; }
        .info-row { display: flex; gap: 20px; margin: 10px 0; font-size: 10px; }
        .info-row span { border-bottom: 1px dotted #000; min-width: 150px; display: inline-block; }
        table.main { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table.main th, table.main td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px; min-height: 25px; }
        table.main th { background-color: #f0f0f0; font-weight: bold; }
        table.main td { height: 28px; }
        .signature-section { margin-top: 20px; display: flex; justify-content: space-between; }
        .signature-box { width: 30%; text-align: center; }
        .signature-line { border-top: 1px solid #000; margin-top: 35px; padding-top: 3px; font-size: 9px; }
        .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; font-size: 14px; }
        .footer { margin-top: 15px; font-size: 8px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 5px; }
        .week-info { background: #f8f9fa; padding: 8px; margin: 10px 0; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Drukuj</button>
    <table class="header-table">
        <tr>
            <td class="logo" rowspan="2">MASARNIA<br>MLO</td>
            <td class="title">${title}</td>
            <td class="doc-info">Nr: ${docNumber}</td>
        </tr>
        <tr>
            <td style="text-align: center; font-size: 10px;">System HACCP - Dokumentacja</td>
            <td class="doc-info">Wyd: 1 | Data: ${dayjs().format('DD.MM.YYYY')}</td>
        </tr>
    </table>
`;

const getTemplateFooter = (notes?: string) => `
    ${notes ? `<div style="margin-top: 15px; font-size: 9px;"><strong>Uwagi:</strong> ${notes}</div>` : ''}
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">Data i podpis osoby wykonującej</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Podpis osoby kontrolującej</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Podpis kierownika HACCP</div>
        </div>
    </div>
    <div class="footer">
        Formularz wydrukowany z systemu HACCP | Wypełnić czytelnie długopisem | Przechowywać min. 2 lata
    </div>
</body>
</html>
`;

// WZORZEC: Tygodniowy formularz kontroli temperatury
router.get('/templates/temperature-weekly', async (req: Request, res: Response) => {
  try {
    const points = await prisma.temperaturePoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const weekStart = req.query.week 
      ? dayjs(req.query.week as string).startOf('week')
      : dayjs().startOf('week');
    
    const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'];

    let html = getTemplateHeader('KARTA KONTROLI TEMPERATURY - TYDZIEŃ', 'F-HACCP-01');
    
    html += `
      <div class="week-info">
        <strong>Tydzień:</strong> ${weekStart.format('DD.MM.YYYY')} - ${weekStart.add(6, 'day').format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Wypełnił:</strong> ____________________
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th rowspan="2" style="width: 25%;">Punkt pomiaru</th>
            <th rowspan="2" style="width: 10%;">Norma (°C)</th>
            <th colspan="7">Temperatura (°C) - rano / wieczór</th>
          </tr>
          <tr>
            ${days.map(d => `<th style="width: 9%;">${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (const point of points) {
      html += `
        <tr>
          <td style="text-align: left; font-size: 9px;">${point.name}</td>
          <td>${point.minTemp} - ${point.maxTemp}</td>
          ${days.map(() => `<td style="font-size: 8px;"><br>/<br></td>`).join('')}
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 10px; font-size: 9px;">
        <strong>Legenda:</strong> Wpisać temperaturę rano (góra) i wieczorem (dół). 
        Przy przekroczeniu normy - zaznaczyć kolorem i podjąć działania korygujące.
      </div>
      
      <div style="margin-top: 10px;">
        <strong>Uwagi / Działania korygujące:</strong>
        <div style="border: 1px solid #000; min-height: 60px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Dzienny formularz przyjęcia surowców
router.get('/templates/reception-daily', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? dayjs(req.query.date as string) : dayjs();
    
    let html = getTemplateHeader('KARTA PRZYJĘCIA SUROWCÓW', 'F-HACCP-02');
    
    html += `
      <div class="info-row">
        <strong>Data:</strong> <span>${date.format('DD.MM.YYYY')}</span>
        &nbsp;&nbsp;&nbsp;
        <strong>Przyjmujący:</strong> <span style="min-width: 200px;"></span>
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th style="width: 8%;">Godz.</th>
            <th style="width: 18%;">Surowiec</th>
            <th style="width: 15%;">Dostawca</th>
            <th style="width: 12%;">Nr partii</th>
            <th style="width: 8%;">Ilość</th>
            <th style="width: 7%;">Temp. (°C)</th>
            <th style="width: 6%;">HDI</th>
            <th style="width: 8%;">Ocena wizualna</th>
            <th style="width: 6%;">Zgodny</th>
            <th style="width: 12%;">Podpis</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 10 pustych wierszy
    for (let i = 0; i < 10; i++) {
      html += `
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>☐</td>
          <td>☐ OK ☐ NIE</td>
          <td>☐ T ☐ N</td>
          <td></td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      
      <div style="font-size: 9px; margin-top: 10px;">
        <strong>Kryteria przyjęcia:</strong> Temp. mięsa świeżego ≤4°C, mrożonego ≤-18°C | HDI - Handlowy Dokument Identyfikacyjny | 
        Ocena wizualna: opakowanie, zapach, barwa
      </div>
      
      <div style="margin-top: 10px;">
        <strong>Dostawy odrzucone / Niezgodności:</strong>
        <div style="border: 1px solid #000; min-height: 40px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Karta mycia i dezynfekcji
router.get('/templates/cleaning-daily', async (req: Request, res: Response) => {
  try {
    const areas = await prisma.cleaningArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const date = req.query.date ? dayjs(req.query.date as string) : dayjs();
    
    let html = getTemplateHeader('KARTA MYCIA I DEZYNFEKCJI', 'F-HACCP-03');
    
    html += `
      <div class="info-row">
        <strong>Data:</strong> <span>${date.format('DD.MM.YYYY')}</span>
        &nbsp;&nbsp;&nbsp;
        <strong>Zmiana:</strong> <span>☐ I &nbsp; ☐ II &nbsp; ☐ III</span>
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th style="width: 25%;">Obszar / Urządzenie</th>
            <th style="width: 12%;">Częstotliwość</th>
            <th style="width: 15%;">Środek myjący</th>
            <th style="width: 8%;">Godz.</th>
            <th style="width: 10%;">Wykonał</th>
            <th style="width: 10%;">Kontrola</th>
            <th style="width: 8%;">Ocena</th>
            <th style="width: 12%;">Podpis</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const area of areas) {
      html += `
        <tr>
          <td style="text-align: left; font-size: 9px;">${area.name}</td>
          <td style="font-size: 9px;">${area.frequency}</td>
          <td></td>
          <td></td>
          <td></td>
          <td>☐</td>
          <td>☐ OK ☐ NIE</td>
          <td></td>
        </tr>
      `;
    }

    // Dodatkowe puste wiersze
    for (let i = 0; i < 3; i++) {
      html += `
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>☐</td>
          <td>☐ OK ☐ NIE</td>
          <td></td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 10px;">
        <strong>Uwagi / Działania korygujące:</strong>
        <div style="border: 1px solid #000; min-height: 40px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Karta produkcji
router.get('/templates/production-daily', async (req: Request, res: Response) => {
  try {
    const date = req.query.date ? dayjs(req.query.date as string) : dayjs();
    
    let html = getTemplateHeader('KARTA PRODUKCJI DZIENNEJ', 'F-HACCP-04');
    
    html += `
      <div class="info-row">
        <strong>Data produkcji:</strong> <span>${date.format('DD.MM.YYYY')}</span>
        &nbsp;&nbsp;&nbsp;
        <strong>Kierownik zmiany:</strong> <span style="min-width: 200px;"></span>
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th style="width: 10%;">Nr partii</th>
            <th style="width: 18%;">Nazwa produktu</th>
            <th style="width: 10%;">Ilość (kg)</th>
            <th style="width: 15%;">Surowce (nr partii)</th>
            <th style="width: 8%;">Temp. obróbki</th>
            <th style="width: 8%;">Czas (min)</th>
            <th style="width: 8%;">Temp. wewn.</th>
            <th style="width: 10%;">Wykonał</th>
            <th style="width: 13%;">Podpis</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 8 pustych wierszy
    for (let i = 0; i < 8; i++) {
      html += `
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      
      <div style="font-size: 9px; margin-top: 10px;">
        <strong>CCP1 - Obróbka termiczna:</strong> Temp. wewnętrzna produktu min. 72°C przez min. 2 min
      </div>
      
      <div style="margin-top: 10px;">
        <strong>Uwagi / Niezgodności / Działania korygujące:</strong>
        <div style="border: 1px solid #000; min-height: 50px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Kontrola DDD
router.get('/templates/pest-control-monthly', async (req: Request, res: Response) => {
  try {
    const points = await prisma.pestControlPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const month = req.query.month 
      ? dayjs(req.query.month as string)
      : dayjs();
    
    let html = getTemplateHeader('KARTA KONTROLI DDD - MIESIĄC', 'F-HACCP-05');
    
    html += `
      <div class="info-row">
        <strong>Miesiąc:</strong> <span>${month.format('MMMM YYYY')}</span>
        &nbsp;&nbsp;&nbsp;
        <strong>Firma DDD:</strong> <span style="min-width: 200px;"></span>
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th style="width: 8%;">Nr</th>
            <th style="width: 15%;">Typ</th>
            <th style="width: 20%;">Lokalizacja</th>
            <th style="width: 12%;">Data kontroli</th>
            <th style="width: 10%;">Stan</th>
            <th style="width: 10%;">Aktywność</th>
            <th style="width: 15%;">Uwagi</th>
            <th style="width: 10%;">Podpis</th>
          </tr>
        </thead>
        <tbody>
    `;

    points.forEach((point, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-size: 9px;">${point.type === 'TRAP' ? 'Pułapka' : point.type === 'BAIT' ? 'Stacja' : point.type === 'LAMP' ? 'Lampa' : point.type}</td>
          <td style="text-align: left; font-size: 9px;">${point.location}</td>
          <td></td>
          <td>☐ OK ☐ NIE</td>
          <td>☐ TAK ☐ NIE</td>
          <td></td>
          <td></td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 10px;">
        <strong>Podsumowanie kontroli / Działania:</strong>
        <div style="border: 1px solid #000; min-height: 50px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Karta peklowania
router.get('/templates/curing', async (req: Request, res: Response) => {
  try {
    let html = getTemplateHeader('KARTA PROCESU PEKLOWANIA', 'F-HACCP-06');
    
    html += `
      <div class="info-row">
        <strong>Nr partii peklowania:</strong> <span style="min-width: 150px;"></span>
        &nbsp;&nbsp;
        <strong>Data rozpoczęcia:</strong> <span style="min-width: 100px;"></span>
        &nbsp;&nbsp;
        <strong>Planowana data zakończenia:</strong> <span style="min-width: 100px;"></span>
      </div>
      
      <table class="main" style="margin-top: 15px;">
        <tr>
          <th colspan="4">SUROWIEC</th>
        </tr>
        <tr>
          <td style="width: 25%; text-align: left;"><strong>Nazwa mięsa:</strong></td>
          <td style="width: 25%;"></td>
          <td style="width: 25%; text-align: left;"><strong>Nr partii dostawy:</strong></td>
          <td style="width: 25%;"></td>
        </tr>
        <tr>
          <td style="text-align: left;"><strong>Ilość (kg):</strong></td>
          <td></td>
          <td style="text-align: left;"><strong>Dostawca:</strong></td>
          <td></td>
        </tr>
      </table>
      
      <table class="main" style="margin-top: 10px;">
        <tr>
          <th colspan="4">METODA PEKLOWANIA</th>
        </tr>
        <tr>
          <td colspan="4" style="text-align: left;">
            ☐ Suche (sól peklowa: ______ kg) &nbsp;&nbsp;&nbsp;
            ☐ Nastrzykowe (solanka)
          </td>
        </tr>
      </table>
      
      <table class="main" style="margin-top: 10px;">
        <tr>
          <th colspan="4">SKŁAD SOLANKI (dla metody nastrzykowej)</th>
        </tr>
        <tr>
          <td style="width: 25%; text-align: left;"><strong>Woda (L):</strong></td>
          <td style="width: 25%;"></td>
          <td style="width: 25%; text-align: left;"><strong>Sól peklowa (kg):</strong></td>
          <td style="width: 25%;"></td>
        </tr>
        <tr>
          <td style="text-align: left;"><strong>Maggi (kg):</strong></td>
          <td></td>
          <td style="text-align: left;"><strong>Cukier (kg):</strong></td>
          <td></td>
        </tr>
      </table>
      
      <table class="main" style="margin-top: 10px;">
        <tr>
          <th colspan="6">KONTROLA TEMPERATURY PEKLOWANIA</th>
        </tr>
        <tr>
          <th>Dzień</th>
          <th>Data</th>
          <th>Godz.</th>
          <th>Temp. (°C)</th>
          <th>Ocena wizualna</th>
          <th>Podpis</th>
        </tr>
    `;

    for (let i = 1; i <= 7; i++) {
      html += `
        <tr>
          <td>${i}</td>
          <td></td>
          <td></td>
          <td></td>
          <td>☐ OK</td>
          <td></td>
        </tr>
      `;
    }

    html += `
      </table>
      
      <table class="main" style="margin-top: 10px;">
        <tr>
          <th colspan="4">ZAKOŃCZENIE PEKLOWANIA</th>
        </tr>
        <tr>
          <td style="width: 25%; text-align: left;"><strong>Data zakończenia:</strong></td>
          <td style="width: 25%;"></td>
          <td style="width: 25%; text-align: left;"><strong>Godzina:</strong></td>
          <td style="width: 25%;"></td>
        </tr>
        <tr>
          <td style="text-align: left;"><strong>Ocena końcowa:</strong></td>
          <td colspan="3">☐ Produkt zgodny, gotowy do dalszej obróbki &nbsp;&nbsp; ☐ Niezgodny</td>
        </tr>
      </table>
      
      <div style="margin-top: 10px;">
        <strong>Uwagi:</strong>
        <div style="border: 1px solid #000; min-height: 40px; margin-top: 5px;"></div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// WZORZEC: Ewidencja odpadów kat. 3
router.get('/templates/waste-monthly', async (req: Request, res: Response) => {
  try {
    const month = req.query.month 
      ? dayjs(req.query.month as string)
      : dayjs();
    
    let html = getTemplateHeader('EWIDENCJA ODPADÓW KAT. 3 - MIESIĄC', 'F-HACCP-07');
    
    html += `
      <div class="info-row">
        <strong>Miesiąc:</strong> <span>${month.format('MMMM YYYY')}</span>
        &nbsp;&nbsp;&nbsp;
        <strong>Firma odbierająca:</strong> <span style="min-width: 200px;"></span>
      </div>
      
      <table class="main">
        <thead>
          <tr>
            <th style="width: 10%;">Data</th>
            <th style="width: 20%;">Rodzaj odpadu</th>
            <th style="width: 10%;">Ilość (kg)</th>
            <th style="width: 15%;">Nr pojemnika</th>
            <th style="width: 15%;">Przekazano firmie</th>
            <th style="width: 15%;">Nr dokumentu</th>
            <th style="width: 15%;">Podpis</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 15 pustych wierszy
    for (let i = 0; i < 15; i++) {
      html += `
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 10px; display: flex; gap: 40px;">
        <div><strong>Suma miesięczna:</strong> _________ kg</div>
      </div>
    `;
    
    html += getTemplateFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania wzorca:', error);
    res.status(500).json({ error: 'Błąd generowania wzorca' });
  }
});

// Lista dostępnych wzorców
router.get('/templates', async (req: Request, res: Response) => {
  const templates = [
    { id: 'temperature-weekly', name: 'Karta kontroli temperatury - tydzień', code: 'F-HACCP-01', description: 'Tygodniowy formularz do ręcznego zapisu pomiarów temperatury' },
    { id: 'reception-daily', name: 'Karta przyjęcia surowców', code: 'F-HACCP-02', description: 'Dzienny formularz kontroli przyjęć dostaw' },
    { id: 'cleaning-daily', name: 'Karta mycia i dezynfekcji', code: 'F-HACCP-03', description: 'Dzienny formularz mycia i dezynfekcji' },
    { id: 'production-daily', name: 'Karta produkcji dziennej', code: 'F-HACCP-04', description: 'Dzienny formularz dokumentacji produkcji' },
    { id: 'pest-control-monthly', name: 'Karta kontroli DDD - miesiąc', code: 'F-HACCP-05', description: 'Miesięczny formularz kontroli punktów DDD' },
    { id: 'curing', name: 'Karta procesu peklowania', code: 'F-HACCP-06', description: 'Formularz dokumentacji procesu peklowania' },
    { id: 'waste-monthly', name: 'Ewidencja odpadów kat. 3', code: 'F-HACCP-07', description: 'Miesięczna ewidencja odpadów kategorii 3' },
  ];
  
  res.json(templates);
});

// ============================================
// RAPORTY Z DANYMI (wypełnione formularze)
// ============================================

// RAPORT: Temperatura - tydzień z danymi
router.get('/reports/temperature-weekly', async (req: Request, res: Response) => {
  try {
    const weekStart = req.query.week 
      ? dayjs(req.query.week as string).startOf('week')
      : dayjs().startOf('week');
    const weekEnd = weekStart.add(6, 'day').endOf('day');

    const points = await prisma.temperaturePoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const readings = await prisma.temperatureReading.findMany({
      where: {
        readAt: {
          gte: weekStart.toDate(),
          lte: weekEnd.toDate(),
        },
      },
      include: {
        temperaturePoint: true,
        user: { select: { name: true } },
      },
      orderBy: { readAt: 'asc' },
    });

    // Grupuj odczyty po punkcie i dniu
    const readingsByPointAndDay: Record<number, Record<string, { morning?: number; evening?: number; isOk: boolean }>> = {};
    
    for (const reading of readings) {
      const pointId = reading.temperaturePointId;
      if (!readingsByPointAndDay[pointId]) {
        readingsByPointAndDay[pointId] = {};
      }
      const dayKey = dayjs(reading.readAt).format('YYYY-MM-DD');
      if (!readingsByPointAndDay[pointId][dayKey]) {
        readingsByPointAndDay[pointId][dayKey] = { isOk: true };
      }
      
      const hour = dayjs(reading.readAt).hour();
      if (hour < 12) {
        readingsByPointAndDay[pointId][dayKey].morning = reading.temperature;
      } else {
        readingsByPointAndDay[pointId][dayKey].evening = reading.temperature;
      }
      if (!reading.isCompliant) {
        readingsByPointAndDay[pointId][dayKey].isOk = false;
      }
    }

    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(weekStart.add(i, 'day').format('dd DD.MM'));
    }

    let html = getDocumentHeader('Raport temperatury - tydzień');
    
    html += `
      <div class="doc-title">KARTA KONTROLI TEMPERATURY - TYDZIEŃ</div>
      <div class="doc-info">Nr formularza: F-HACCP-01 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Tydzień:</strong> ${weekStart.format('DD.MM.YYYY')} - ${weekStart.add(6, 'day').format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba odczytów:</strong> ${readings.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 25%;">Punkt pomiaru</th>
            <th rowspan="2" style="width: 10%;">Norma (°C)</th>
            <th colspan="7">Temperatura (°C) - rano / wieczór</th>
          </tr>
          <tr>
            ${days.map(d => `<th style="width: 9%;">${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (const point of points) {
      const pointReadings = readingsByPointAndDay[point.id] || {};
      html += `
        <tr>
          <td style="text-align: left; font-size: 9px;">${point.name}</td>
          <td>${point.minTemp} - ${point.maxTemp}</td>
    `;
      
      for (let i = 0; i < 7; i++) {
        const dayKey = weekStart.add(i, 'day').format('YYYY-MM-DD');
        const dayData = pointReadings[dayKey];
        
        if (dayData) {
          const morningClass = dayData.morning !== undefined && (dayData.morning < point.minTemp || dayData.morning > point.maxTemp) ? 'temp-danger' : '';
          const eveningClass = dayData.evening !== undefined && (dayData.evening < point.minTemp || dayData.evening > point.maxTemp) ? 'temp-danger' : '';
          html += `<td style="font-size: 9px;">
            <span class="${morningClass}">${dayData.morning !== undefined ? dayData.morning.toFixed(1) : '-'}</span>
            /
            <span class="${eveningClass}">${dayData.evening !== undefined ? dayData.evening.toFixed(1) : '-'}</span>
          </td>`;
        } else {
          html += `<td style="font-size: 9px; color: #999;">-/-</td>`;
        }
      }
      
      html += `</tr>`;
    }

    // Podsumowanie niezgodności
    const nonCompliant = readings.filter(r => !r.isCompliant);

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 15px;">
        <strong>Niezgodności w tym tygodniu:</strong> ${nonCompliant.length > 0 ? nonCompliant.length : 'Brak'}
      </div>
    `;

    if (nonCompliant.length > 0) {
      html += `<table style="margin-top: 10px;">
        <thead><tr><th>Data</th><th>Punkt</th><th>Temp.</th><th>Norma</th></tr></thead>
        <tbody>`;
      for (const r of nonCompliant.slice(0, 10)) {
        html += `<tr>
          <td>${dayjs(r.readAt).format('DD.MM HH:mm')}</td>
          <td>${r.temperaturePoint.name}</td>
          <td class="temp-danger">${r.temperature.toFixed(1)}°C</td>
          <td>${r.temperaturePoint.minTemp} - ${r.temperaturePoint.maxTemp}°C</td>
        </tr>`;
      }
      html += `</tbody></table>`;
    }

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// RAPORT: Przyjęcia surowców z danymi
router.get('/reports/reception', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate 
      ? dayjs(req.query.startDate as string).startOf('day')
      : dayjs().startOf('week');
    const endDate = req.query.endDate 
      ? dayjs(req.query.endDate as string).endOf('day')
      : dayjs().endOf('week');

    const receptions = await prisma.rawMaterialReception.findMany({
      where: {
        receivedAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
      orderBy: { receivedAt: 'asc' },
    });

    let html = getDocumentHeader('Raport przyjęć surowców');
    
    html += `
      <div class="doc-title">KARTA PRZYJĘCIA SUROWCÓW</div>
      <div class="doc-info">Nr formularza: F-HACCP-02 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Okres:</strong> ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba przyjęć:</strong> ${receptions.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Data</th>
            <th style="width: 8%;">Godz.</th>
            <th style="width: 18%;">Surowiec</th>
            <th style="width: 14%;">Dostawca</th>
            <th style="width: 12%;">Nr partii</th>
            <th style="width: 10%;">Ilość</th>
            <th style="width: 8%;">Temp.</th>
            <th style="width: 10%;">Przyjął</th>
            <th style="width: 12%;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const rec of receptions) {
      const tempClass = rec.temperature !== null ? 
        (rec.temperature > 4 ? 'temp-danger' : 'temp-ok') : '';
      
      html += `
        <tr>
          <td>${dayjs(rec.receivedAt).format('DD.MM')}</td>
          <td>${rec.receivedTime || dayjs(rec.receivedAt).format('HH:mm')}</td>
          <td style="text-align: left; font-size: 9px;">${rec.rawMaterial?.name || '-'}</td>
          <td style="font-size: 9px;">${rec.supplier?.name || '-'}</td>
          <td style="font-size: 9px;">${rec.batchNumber || '-'}</td>
          <td>${rec.quantity} ${rec.unit}</td>
          <td class="${tempClass}">${rec.temperature !== null ? rec.temperature + '°C' : '-'}</td>
          <td style="font-size: 9px;">${rec.user?.name || '-'}</td>
          <td>${rec.isCompliant ? '<span class="badge-ok">Przyjęty</span>' : '<span class="badge-fail">Odrzucony</span>'}</td>
        </tr>
      `;
    }

    if (receptions.length === 0) {
      html += `<tr><td colspan="9" style="text-align: center; color: #666;">Brak przyjęć w tym okresie</td></tr>`;
    }

    // Podsumowanie
    const rejected = receptions.filter(r => !r.isCompliant);
    const totalQty = receptions.reduce((sum, r) => sum + (r.quantity || 0), 0);

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 15px; display: flex; gap: 30px;">
        <div><strong>Razem przyjęto:</strong> ${totalQty.toFixed(1)} kg</div>
        <div><strong>Odrzucono:</strong> ${rejected.length} dostaw</div>
      </div>
    `;

    if (rejected.length > 0) {
      html += `
        <div style="margin-top: 10px;">
          <strong>Dostawy odrzucone:</strong>
          <ul style="margin: 5px 0; padding-left: 20px; font-size: 10px;">
      `;
      for (const r of rejected) {
        html += `<li>${dayjs(r.receivedAt).format('DD.MM')} - ${r.rawMaterial?.name} od ${r.supplier?.name}: ${r.notes || 'brak uwag'}</li>`;
      }
      html += `</ul></div>`;
    }

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// RAPORT: Mycie i dezynfekcja z danymi
router.get('/reports/cleaning', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate 
      ? dayjs(req.query.startDate as string).startOf('day')
      : dayjs().startOf('week');
    const endDate = req.query.endDate 
      ? dayjs(req.query.endDate as string).endOf('day')
      : dayjs().endOf('week');

    const records = await prisma.cleaningRecord.findMany({
      where: {
        cleanedAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
      orderBy: [{ cleanedAt: 'asc' }],
    });

    let html = getDocumentHeader('Raport mycia i dezynfekcji');
    
    html += `
      <div class="doc-title">KARTA MYCIA I DEZYNFEKCJI</div>
      <div class="doc-info">Nr formularza: F-HACCP-03 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Okres:</strong> ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba zapisów:</strong> ${records.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">Data</th>
            <th style="width: 22%;">Obszar / Urządzenie</th>
            <th style="width: 12%;">Metoda</th>
            <th style="width: 14%;">Środek myjący</th>
            <th style="width: 14%;">Wykonał</th>
            <th style="width: 10%;">Weryfikacja</th>
            <th style="width: 18%;">Uwagi</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const rec of records) {
      html += `
        <tr>
          <td>${dayjs(rec.cleanedAt).format('DD.MM')}</td>
          <td style="text-align: left; font-size: 9px;">${rec.cleaningArea?.name || '-'}</td>
          <td style="font-size: 9px;">${rec.method || '-'}</td>
          <td style="font-size: 9px;">${rec.chemicals || '-'}</td>
          <td style="font-size: 9px;">${rec.user?.name || '-'}</td>
          <td>${rec.isVerified ? '<span class="badge-ok">OK</span>' : '<span class="badge-warning">Oczekuje</span>'}</td>
          <td style="font-size: 8px;">${rec.notes || '-'}</td>
        </tr>
      `;
    }

    if (records.length === 0) {
      html += `<tr><td colspan="7" style="text-align: center; color: #666;">Brak zapisów w tym okresie</td></tr>`;
    }

    // Podsumowanie
    const verified = records.filter(r => r.isVerified).length;

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 15px; display: flex; gap: 30px;">
        <div><strong>Zweryfikowane:</strong> ${verified}</div>
        <div><strong>Oczekujące:</strong> ${records.length - verified}</div>
      </div>
    `;

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// RAPORT: Produkcja z danymi
router.get('/reports/production', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate 
      ? dayjs(req.query.startDate as string).startOf('day')
      : dayjs().startOf('week');
    const endDate = req.query.endDate 
      ? dayjs(req.query.endDate as string).endOf('day')
      : dayjs().endOf('week');

    const batches = await prisma.productionBatch.findMany({
      where: {
        productionDate: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: true,
            curingBatch: true,
          },
        },
      },
      orderBy: { productionDate: 'asc' },
    });

    let html = getDocumentHeader('Raport produkcji');
    
    html += `
      <div class="doc-title">KARTA PRODUKCJI</div>
      <div class="doc-info">Nr formularza: F-HACCP-04 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Okres:</strong> ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba partii:</strong> ${batches.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Data</th>
            <th style="width: 12%;">Nr partii</th>
            <th style="width: 18%;">Produkt</th>
            <th style="width: 10%;">Ilość (kg)</th>
            <th style="width: 18%;">Surowce</th>
            <th style="width: 10%;">T. końcowa</th>
            <th style="width: 12%;">Wykonał</th>
            <th style="width: 12%;">CCP1</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const batch of batches) {
      const finalTempOk = batch.finalTemperature !== null && batch.finalTemperature >= 72;
      const requiredTemp = batch.product?.requiredTemperature || 72;
      
      // Lista surowców
      const materialsStr = batch.materials
        .map(m => m.reception?.batchNumber || m.curingBatch?.batchNumber || m.rawMaterial?.name || '?')
        .slice(0, 3)
        .join(', ');
      
      html += `
        <tr>
          <td>${dayjs(batch.productionDate).format('DD.MM')}</td>
          <td style="font-size: 9px;">${batch.batchNumber}</td>
          <td style="text-align: left; font-size: 9px;">${batch.product?.name || '-'}</td>
          <td>${batch.quantity}</td>
          <td style="font-size: 8px;">${materialsStr || '-'}</td>
          <td class="${batch.finalTemperature ? (finalTempOk ? 'temp-ok' : 'temp-danger') : ''}">${batch.finalTemperature ? batch.finalTemperature + '°C' : '-'}</td>
          <td style="font-size: 9px;">${batch.user?.name || '-'}</td>
          <td>${batch.finalTemperature !== null ? (batch.finalTemperature >= requiredTemp ? '<span class="badge-ok">✓</span>' : '<span class="badge-fail">✗</span>') : '-'}</td>
        </tr>
      `;
    }

    if (batches.length === 0) {
      html += `<tr><td colspan="8" style="text-align: center; color: #666;">Brak partii w tym okresie</td></tr>`;
    }

    // Podsumowanie
    const totalQty = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const ccpOk = batches.filter(b => b.finalTemperature !== null && b.finalTemperature >= 72).length;
    const ccpFail = batches.filter(b => b.finalTemperature !== null && b.finalTemperature < 72).length;

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 15px;">
        <strong>CCP1 - Obróbka termiczna:</strong> Temp. wewnętrzna produktu min. 72°C (lub wg wymagań produktu)
      </div>
      
      <div style="margin-top: 10px; display: flex; gap: 30px;">
        <div><strong>Razem wyprodukowano:</strong> ${totalQty.toFixed(1)} kg</div>
        <div><strong>CCP1 zgodne:</strong> ${ccpOk}</div>
        <div><strong>CCP1 niezgodne:</strong> ${ccpFail}</div>
      </div>
    `;

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// RAPORT: Kontrola DDD z danymi
router.get('/reports/pest-control', async (req: Request, res: Response) => {
  try {
    const month = req.query.month 
      ? dayjs(req.query.month as string)
      : dayjs();
    const startDate = month.startOf('month');
    const endDate = month.endOf('month');

    const points = await prisma.pestControlPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const checks = await prisma.pestControlCheck.findMany({
      where: {
        checkedAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        pestControlPoint: true,
        user: { select: { name: true } },
      },
      orderBy: { checkedAt: 'asc' },
    });

    let html = getDocumentHeader('Raport kontroli DDD');
    
    html += `
      <div class="doc-title">KARTA KONTROLI DDD - MIESIĄC</div>
      <div class="doc-info">Nr formularza: F-HACCP-05 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Miesiąc:</strong> ${month.format('MMMM YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba kontroli:</strong> ${checks.length}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 6%;">Nr</th>
            <th style="width: 12%;">Typ</th>
            <th style="width: 20%;">Lokalizacja</th>
            <th style="width: 12%;">Data</th>
            <th style="width: 10%;">Stan</th>
            <th style="width: 14%;">Kontrolujący</th>
            <th style="width: 26%;">Ustalenia/Działania</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Grupuj kontrole po punkcie
    for (const point of points) {
      const pointChecks = checks.filter(c => c.pestControlPointId === point.id);
      
      if (pointChecks.length === 0) {
        html += `
          <tr>
            <td>${point.id}</td>
            <td style="font-size: 9px;">${point.type === 'TRAP' ? 'Pułapka' : point.type === 'BAIT' ? 'Stacja' : point.type === 'LAMP' ? 'Lampa' : point.type}</td>
            <td style="text-align: left; font-size: 9px;">${point.location}</td>
            <td colspan="4" style="color: #999; text-align: center;">Brak kontroli w tym miesiącu</td>
          </tr>
        `;
      } else {
        for (let i = 0; i < pointChecks.length; i++) {
          const check = pointChecks[i];
          html += `
            <tr>
              ${i === 0 ? `
                <td rowspan="${pointChecks.length}">${point.id}</td>
                <td rowspan="${pointChecks.length}" style="font-size: 9px;">${point.type === 'TRAP' ? 'Pułapka' : point.type === 'BAIT' ? 'Stacja' : point.type === 'LAMP' ? 'Lampa' : point.type}</td>
                <td rowspan="${pointChecks.length}" style="text-align: left; font-size: 9px;">${point.location}</td>
              ` : ''}
              <td>${dayjs(check.checkedAt).format('DD.MM')}</td>
              <td>${check.status === 'OK' ? '<span class="badge-ok">OK</span>' : '<span class="badge-fail">Problem</span>'}</td>
              <td style="font-size: 9px;">${check.user?.name || '-'}</td>
              <td style="font-size: 8px;">${check.findings || '-'} ${check.actionTaken ? '→ ' + check.actionTaken : ''}</td>
            </tr>
          `;
        }
      }
    }

    // Podsumowanie
    const problems = checks.filter(c => c.status !== 'OK').length;

    html += `
        </tbody>
      </table>
      
      <div style="margin-top: 15px; display: flex; gap: 30px;">
        <div><strong>Punkty kontrolne:</strong> ${points.length}</div>
        <div><strong>Wykonane kontrole:</strong> ${checks.length}</div>
        <div><strong>Problemy wykryte:</strong> ${problems}</div>
      </div>
    `;

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// RAPORT: Peklowanie z danymi
router.get('/reports/curing', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate 
      ? dayjs(req.query.startDate as string).startOf('day')
      : dayjs().subtract(30, 'day').startOf('day');
    const endDate = req.query.endDate 
      ? dayjs(req.query.endDate as string).endOf('day')
      : dayjs().endOf('day');

    const batches = await prisma.curingBatch.findMany({
      where: {
        startDate: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
      include: {
        reception: {
          include: {
            rawMaterial: true,
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    let html = getDocumentHeader('Raport peklowania');
    
    html += `
      <div class="doc-title">KARTY PROCESU PEKLOWANIA</div>
      <div class="doc-info">Nr formularza: F-HACCP-06 | Wygenerowano z systemu HACCP</div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 5px;">
        <strong>Okres:</strong> ${startDate.format('DD.MM.YYYY')} - ${endDate.format('DD.MM.YYYY')}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Liczba partii:</strong> ${batches.length}
      </div>
    `;

    for (const batch of batches) {
      const methodName = batch.curingMethod === 'WET' ? 'Mokra' : batch.curingMethod === 'DRY' ? 'Sucha' : 'Nastrzykowa';
      
      html += `
        <div style="border: 2px solid #333; margin: 15px 0; padding: 10px; page-break-inside: avoid;">
          <h3 style="margin: 0 0 10px 0; font-size: 12px; background: #e0e0e0; padding: 5px;">
            Partia: ${batch.batchNumber} | ${batch.productName || batch.reception?.rawMaterial?.name || '-'} | ${batch.meatDescription || ''}
          </h3>
          
          <table style="margin-bottom: 10px;">
            <tr>
              <td style="width: 25%;"><strong>Data rozpoczęcia:</strong></td>
              <td style="width: 25%;">${dayjs(batch.startDate).format('DD.MM.YYYY HH:mm')}</td>
              <td style="width: 25%;"><strong>Data zakończenia:</strong></td>
              <td style="width: 25%;">${batch.actualEndDate ? dayjs(batch.actualEndDate).format('DD.MM.YYYY HH:mm') : 'W trakcie'}</td>
            </tr>
            <tr>
              <td><strong>Ilość mięsa:</strong></td>
              <td>${batch.quantity} ${batch.unit}</td>
              <td><strong>Metoda:</strong></td>
              <td>${methodName}</td>
            </tr>
            <tr>
              <td><strong>Wykonał:</strong></td>
              <td>${batch.user?.name || '-'}</td>
              <td><strong>Status:</strong></td>
              <td>${batch.status === 'COMPLETED' ? '<span class="badge-ok">Zakończone</span>' : batch.status === 'IN_PROGRESS' ? '<span class="badge-warning">W trakcie</span>' : batch.status}</td>
            </tr>
          </table>
          
          <table style="margin-bottom: 10px;">
            <tr><th colspan="4">SKŁAD SOLANKI</th></tr>
            <tr>
              <td><strong>Woda:</strong> ${batch.brineWater || '-'} L</td>
              <td><strong>Sól peklowa:</strong> ${batch.brineSalt || '-'} kg</td>
              <td><strong>Maggi:</strong> ${batch.brineMaggi || '-'} kg</td>
              <td><strong>Cukier:</strong> ${batch.brineSugar || '-'} kg</td>
            </tr>
          </table>
          
          ${batch.notes ? `<p style="font-size: 10px; margin-top: 5px;"><strong>Uwagi:</strong> ${batch.notes}</p>` : ''}
        </div>
      `;
    }

    if (batches.length === 0) {
      html += `<p style="text-align: center; color: #666;">Brak partii peklowania w tym okresie</p>`;
    }

    html += getDocumentFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Błąd generowania raportu:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// Lista dostępnych raportów z danymi
router.get('/reports', async (req: Request, res: Response) => {
  const reports = [
    { id: 'temperature-weekly', name: 'Temperatura - tydzień', code: 'F-HACCP-01', description: 'Pomiary temperatury z wybranego tygodnia', periodType: 'week' },
    { id: 'reception', name: 'Przyjęcia surowców', code: 'F-HACCP-02', description: 'Lista przyjęć dostaw z wybranego okresu', periodType: 'range' },
    { id: 'cleaning', name: 'Mycie i dezynfekcja', code: 'F-HACCP-03', description: 'Zapisy mycia z wybranego okresu', periodType: 'range' },
    { id: 'production', name: 'Produkcja', code: 'F-HACCP-04', description: 'Partie produkcyjne z wybranego okresu', periodType: 'range' },
    { id: 'pest-control', name: 'Kontrola DDD - miesiąc', code: 'F-HACCP-05', description: 'Kontrole punktów DDD z wybranego miesiąca', periodType: 'month' },
    { id: 'curing', name: 'Peklowanie', code: 'F-HACCP-06', description: 'Partie peklowania z wybranego okresu', periodType: 'range' },
  ];
  
  res.json(reports);
});

export default router;

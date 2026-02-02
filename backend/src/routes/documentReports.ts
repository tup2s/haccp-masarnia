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

export default router;

import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import path from 'path';

const router = Router();

// Ścieżka do czcionek z polskimi znakami
const FONT_PATH = path.join(__dirname, '../../fonts/DejaVuSans.ttf');
const FONT_BOLD_PATH = path.join(__dirname, '../../fonts/DejaVuSans-Bold.ttf');

// Helper do tworzenia dokumentu PDF z polskimi znakami
function createPDFDocument(): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.registerFont('Polish', FONT_PATH);
  doc.registerFont('Polish-Bold', FONT_BOLD_PATH);
  doc.font('Polish');
  return doc;
}

// GET /api/reports/temperature
router.get('/temperature', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.readAt = { ...where.readAt, gte: new Date(startDate as string) };
    if (endDate) where.readAt = { ...where.readAt, lte: new Date(endDate as string) };

    const readings = await req.prisma.temperatureReading.findMany({
      where,
      include: {
        temperaturePoint: true,
        user: { select: { name: true } },
      },
      orderBy: { readAt: 'desc' },
    });

    // Create PDF with Polish fonts
    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_temperatury_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Temperatury', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const compliant = readings.filter((r: any) => r.isCompliant).length;
    const nonCompliant = readings.filter((r: any) => !r.isCompliant).length;
    
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Liczba pomiarów: ${readings.length}`);
    doc.text(`Zgodne: ${compliant} (${readings.length > 0 ? ((compliant/readings.length)*100).toFixed(1) : 0}%)`);
    doc.text(`Niezgodne: ${nonCompliant} (${readings.length > 0 ? ((nonCompliant/readings.length)*100).toFixed(1) : 0}%)`);
    doc.moveDown(2);

    // Table header
    doc.font('Polish-Bold').fontSize(14).text('Szczegóły pomiarów', { underline: true });
    doc.moveDown();
    
    // Simple table
    doc.font('Polish').fontSize(9);
    let y = doc.y;
    
    doc.text('Data/Godzina', 50, y);
    doc.text('Punkt', 150, y);
    doc.text('Temp.', 270, y);
    doc.text('Status', 330, y);
    doc.text('Operator', 400, y);
    
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;

    readings.slice(0, 50).forEach((reading: any) => {
      if (y > 750) {
        doc.addPage();
        doc.font('Polish');
        y = 50;
      }
      doc.text(dayjs(reading.readAt).format('DD.MM.YYYY HH:mm'), 50, y);
      doc.text(reading.temperaturePoint.name.substring(0, 20), 150, y);
      doc.text(`${reading.temperature}°C`, 270, y);
      doc.text(reading.isCompliant ? 'OK' : 'NIEZGODNY', 330, y);
      doc.text(reading.user.name.substring(0, 15), 400, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/traceability/:batchNumber
router.get('/traceability/:batchNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.productionBatch.findUnique({
      where: { batchNumber: req.params.batchNumber },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: { include: { supplier: true } },
            curingBatch: { include: { reception: { include: { rawMaterial: true } } } },
            material: true,
            materialReceipt: { include: { material: true, supplier: true } },
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=traceability_${batch.batchNumber}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Traceability', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(14).text(`Partia: ${batch.batchNumber}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Product info
    doc.font('Polish-Bold').fontSize(14).text('Informacje o produkcie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Produkt: ${batch.product.name}`);
    doc.text(`Ilość: ${batch.quantity} ${batch.unit}`);
    doc.text(`Data produkcji: ${dayjs(batch.productionDate).format('DD.MM.YYYY')}`);
    doc.text(`Data ważności: ${dayjs(batch.expiryDate).format('DD.MM.YYYY')}`);
    doc.text(`Status: ${batch.status}`);
    doc.text(`Operator: ${batch.user.name}`);
    doc.moveDown(2);

    // Materials
    doc.font('Polish-Bold').fontSize(14).text('Użyte surowce i materiały', { underline: true });
    doc.moveDown();
    
    batch.materials.forEach((mat: any, index: number) => {
      const name = mat.rawMaterial?.name || mat.curingBatch?.reception?.rawMaterial?.name || mat.material?.name || 'Nieznany';
      doc.font('Polish-Bold').fontSize(11).text(`${index + 1}. ${name}`);
      doc.font('Polish').fontSize(10);
      doc.text(`   Ilość: ${mat.quantity} ${mat.unit}`);
      if (mat.reception) {
        doc.text(`   Partia surowca: ${mat.reception.batchNumber}`);
        doc.text(`   Dostawca: ${mat.reception.supplier?.name || 'N/A'}`);
        doc.text(`   Data przyjęcia: ${dayjs(mat.reception.receivedAt).format('DD.MM.YYYY')}`);
      }
      if (mat.curingBatch) {
        doc.text(`   Partia peklowana: ${mat.curingBatch.batchNumber}`);
      }
      if (mat.materialReceipt) {
        doc.text(`   Materiał: ${mat.material?.name || mat.materialReceipt.material?.name}`);
        doc.text(`   Partia materiału: ${mat.materialReceipt.batchNumber}`);
        doc.text(`   Dostawca: ${mat.materialReceipt.supplier?.name || 'N/A'}`);
      }
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Traceability report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/haccp-plan
router.get('/haccp-plan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const ccps = await req.prisma.cCP.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const hazards = await req.prisma.hazard.findMany({
      orderBy: { significance: 'desc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=plan_haccp_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Plan HACCP', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text('Masarnia MLO', { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // CCPs
    doc.font('Polish-Bold').fontSize(16).text('Krytyczne Punkty Kontroli (CCP)', { underline: true });
    doc.moveDown();

    ccps.forEach((ccp: any) => {
      doc.font('Polish-Bold').fontSize(12).text(`${ccp.name}`);
      doc.font('Polish').fontSize(10);
      doc.text(`Opis: ${ccp.description}`);
      doc.text(`Typ zagrożenia: ${ccp.hazardType}`);
      doc.text(`Limit krytyczny: ${ccp.criticalLimit}`);
      doc.text(`Metoda monitoringu: ${ccp.monitoringMethod}`);
      doc.text(`Częstotliwość: ${ccp.monitoringFrequency}`);
      doc.text(`Działanie korygujące: ${ccp.correctiveAction}`);
      doc.text(`Weryfikacja: ${ccp.verificationMethod}`);
      doc.text(`Dokumentacja: ${ccp.recordKeeping}`);
      doc.moveDown();
    });

    // Hazards
    doc.addPage();
    doc.font('Polish');
    doc.font('Polish-Bold').fontSize(16).text('Analiza Zagrożeń', { underline: true });
    doc.moveDown();

    hazards.forEach((hazard: any) => {
      doc.font('Polish-Bold').fontSize(11).text(`${hazard.name} (${hazard.type})`);
      doc.font('Polish').fontSize(10);
      doc.text(`Źródło: ${hazard.source}`);
      doc.text(`Etap procesu: ${hazard.processStep}`);
      doc.text(`Istotność: ${hazard.significance}`);
      doc.text(`Środki zapobiegawcze: ${hazard.preventiveMeasure}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('HACCP report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/production - Raport produkcji
router.get('/production', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.productionDate = { ...where.productionDate, gte: new Date(startDate as string) };
    if (endDate) where.productionDate = { ...where.productionDate, lte: new Date(endDate as string) };

    const batches = await req.prisma.productionBatch.findMany({
      where,
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            curingBatch: { include: { reception: { include: { rawMaterial: true } } } },
            material: true,
          },
        },
      },
      orderBy: { productionDate: 'desc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_produkcji_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Produkcji', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const totalQuantity = batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
    const byStatus = batches.reduce((acc: any, b: any) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Liczba partii: ${batches.length}`);
    doc.text(`Całkowita ilość: ${totalQuantity.toFixed(2)} kg`);
    doc.text(`W produkcji: ${byStatus['IN_PRODUCTION'] || 0}`);
    doc.text(`Zakończone: ${byStatus['COMPLETED'] || 0}`);
    doc.text(`Zwolnione: ${byStatus['RELEASED'] || 0}`);
    doc.text(`Zablokowane: ${byStatus['BLOCKED'] || 0}`);
    doc.moveDown(2);

    // Table
    doc.font('Polish-Bold').fontSize(14).text('Szczegóły partii', { underline: true });
    doc.moveDown();

    doc.font('Polish').fontSize(9);
    let y = doc.y;
    
    doc.text('Nr partii', 50, y);
    doc.text('Produkt', 130, y);
    doc.text('Ilość', 280, y);
    doc.text('Data prod.', 330, y);
    doc.text('Status', 400, y);
    doc.text('Operator', 470, y);
    
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;

    batches.forEach((batch: any) => {
      if (y > 750) {
        doc.addPage();
        doc.font('Polish');
        y = 50;
      }
      doc.text(batch.batchNumber, 50, y);
      doc.text(batch.product.name.substring(0, 25), 130, y);
      doc.text(`${batch.quantity} ${batch.unit}`, 280, y);
      doc.text(dayjs(batch.productionDate).format('DD.MM.YYYY'), 330, y);
      doc.text(batch.status, 400, y);
      doc.text(batch.user.name.substring(0, 12), 470, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Production report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/cleaning - Raport mycia i dezynfekcji
router.get('/cleaning', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, areaId } = req.query;
    
    const where: any = {};
    if (startDate) where.cleanedAt = { ...where.cleanedAt, gte: new Date(startDate as string) };
    if (endDate) where.cleanedAt = { ...where.cleanedAt, lte: new Date(endDate as string) };
    if (areaId) where.cleaningAreaId = parseInt(areaId as string);

    const records = await req.prisma.cleaningRecord.findMany({
      where,
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
      orderBy: { cleanedAt: 'desc' },
    });

    const areas = await req.prisma.cleaningArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_mycia_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Mycia i Dezynfekcji', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    if (areaId) {
      const area = areas.find((a: any) => a.id === parseInt(areaId as string));
      doc.text(`Strefa: ${area?.name || areaId}`, { align: 'center' });
    }
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary by area
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie wg stref', { underline: true });
    doc.font('Polish').fontSize(11);
    
    const byArea = records.reduce((acc: any, r: any) => {
      const areaName = r.cleaningArea.name;
      if (!acc[areaName]) acc[areaName] = { total: 0, verified: 0 };
      acc[areaName].total++;
      if (r.isVerified) acc[areaName].verified++;
      return acc;
    }, {});

    Object.entries(byArea).forEach(([areaName, stats]: [string, any]) => {
      doc.text(`${areaName}: ${stats.total} myć (${stats.verified} zweryfikowanych)`);
    });
    doc.moveDown(2);

    // Table
    doc.font('Polish-Bold').fontSize(14).text('Szczegóły', { underline: true });
    doc.moveDown();

    doc.font('Polish').fontSize(9);
    let y = doc.y;
    
    doc.text('Data/Godzina', 50, y);
    doc.text('Strefa', 140, y);
    doc.text('Metoda', 250, y);
    doc.text('Środki', 340, y);
    doc.text('Operator', 440, y);
    doc.text('Wer.', 510, y);
    
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;

    records.slice(0, 60).forEach((record: any) => {
      if (y > 750) {
        doc.addPage();
        doc.font('Polish');
        y = 50;
      }
      doc.text(dayjs(record.cleanedAt).format('DD.MM HH:mm'), 50, y);
      doc.text(record.cleaningArea.name.substring(0, 18), 140, y);
      doc.text((record.method || '-').substring(0, 15), 250, y);
      doc.text((record.chemicals || '-').substring(0, 15), 340, y);
      doc.text(record.user.name.substring(0, 10), 440, y);
      doc.text(record.isVerified ? 'TAK' : '-', 510, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Cleaning report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/pest-control - Raport kontroli szkodników
router.get('/pest-control', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.checkedAt = { ...where.checkedAt, gte: new Date(startDate as string) };
    if (endDate) where.checkedAt = { ...where.checkedAt, lte: new Date(endDate as string) };

    const checks = await req.prisma.pestControlCheck.findMany({
      where,
      include: {
        pestControlPoint: true,
        user: { select: { name: true } },
      },
      orderBy: { checkedAt: 'desc' },
    });

    const points = await req.prisma.pestControlPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_ddd_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Kontroli Szkodników (DDD)', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const okCount = checks.filter((c: any) => c.status === 'OK').length;
    const issueCount = checks.filter((c: any) => c.status !== 'OK').length;
    
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Łączna liczba kontroli: ${checks.length}`);
    doc.text(`Bez uwag: ${okCount} (${checks.length > 0 ? ((okCount/checks.length)*100).toFixed(1) : 0}%)`);
    doc.text(`Z uwagami/problemami: ${issueCount}`);
    doc.text(`Aktywne punkty kontrolne: ${points.length}`);
    doc.moveDown(2);

    // Points summary
    doc.font('Polish-Bold').fontSize(14).text('Punkty kontrolne', { underline: true });
    doc.font('Polish').fontSize(10);
    doc.moveDown();
    
    points.forEach((point: any) => {
      const pointChecks = checks.filter((c: any) => c.pestControlPointId === point.id);
      const lastCheck = pointChecks[0];
      doc.text(`${point.name} (${point.type}) - ${point.location || 'brak lokalizacji'}`);
      if (lastCheck) {
        doc.text(`   Ostatnia kontrola: ${dayjs(lastCheck.checkedAt).format('DD.MM.YYYY')} - ${lastCheck.status}`);
      } else {
        doc.text(`   Brak kontroli w okresie`);
      }
    });
    doc.moveDown(2);

    // Issues
    const issues = checks.filter((c: any) => c.status !== 'OK' || c.findings);
    if (issues.length > 0) {
      doc.addPage();
      doc.font('Polish');
      doc.font('Polish-Bold').fontSize(14).text('Wykryte problemy', { underline: true });
      doc.moveDown();
      doc.font('Polish').fontSize(10);
      
      issues.forEach((issue: any) => {
        doc.font('Polish-Bold').text(`${issue.pestControlPoint.name} - ${dayjs(issue.checkedAt).format('DD.MM.YYYY')}`);
        doc.font('Polish').text(`   Status: ${issue.status}`);
        if (issue.findings) doc.text(`   Uwagi: ${issue.findings}`);
        doc.text(`   Kontroler: ${issue.user.name}`);
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error) {
    console.error('Pest control report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/curing - Raport peklowania
router.get('/curing', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.startDate = { ...where.startDate, gte: new Date(startDate as string) };
    if (endDate) where.startDate = { ...where.startDate, lte: new Date(endDate as string) };

    const batches = await req.prisma.curingBatch.findMany({
      where,
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_peklowania_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Peklowania', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const totalMeat = batches.reduce((sum: number, b: any) => sum + b.meatQuantity, 0);
    const byStatus = batches.reduce((acc: any, b: any) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Liczba partii: ${batches.length}`);
    doc.text(`Całkowita ilość mięsa: ${totalMeat.toFixed(2)} kg`);
    doc.text(`W peklowaniu: ${byStatus['CURING'] || 0}`);
    doc.text(`Gotowe: ${byStatus['READY'] || 0}`);
    doc.text(`Zużyte: ${byStatus['USED'] || 0}`);
    doc.moveDown(2);

    // Table
    doc.font('Polish-Bold').fontSize(14).text('Szczegóły partii', { underline: true });
    doc.moveDown();

    doc.font('Polish').fontSize(8);
    let y = doc.y;
    
    doc.text('Nr partii', 50, y);
    doc.text('Surowiec', 110, y);
    doc.text('Ilość', 210, y);
    doc.text('Start', 260, y);
    doc.text('Koniec', 320, y);
    doc.text('Sól %', 375, y);
    doc.text('Status', 410, y);
    doc.text('Operator', 470, y);
    
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;

    batches.forEach((batch: any) => {
      if (y > 750) {
        doc.addPage();
        doc.font('Polish');
        y = 50;
      }
      doc.text(batch.batchNumber, 50, y);
      doc.text((batch.reception?.rawMaterial?.name || batch.meatDescription || '-').substring(0, 18), 110, y);
      doc.text(`${batch.meatQuantity} kg`, 210, y);
      doc.text(dayjs(batch.startDate).format('DD.MM.YY'), 260, y);
      doc.text(dayjs(batch.endDate).format('DD.MM.YY'), 320, y);
      doc.text(`${batch.saltPercentage}%`, 375, y);
      doc.text(batch.status, 410, y);
      doc.text(batch.user.name.substring(0, 10), 470, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Curing report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/audits - Raport audytów
router.get('/audits', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.auditDate = { ...where.auditDate, gte: new Date(startDate as string) };
    if (endDate) where.auditDate = { ...where.auditDate, lte: new Date(endDate as string) };

    const records = await req.prisma.auditRecord.findMany({
      where,
      include: {
        checklist: true,
        user: { select: { name: true } },
      },
      orderBy: { auditDate: 'desc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_audytow_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Audytów Wewnętrznych', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const avgScore = records.length > 0 
      ? records.reduce((sum: number, r: any) => sum + r.score, 0) / records.length 
      : 0;
    const passedCount = records.filter((r: any) => r.score >= 80).length;
    const failedCount = records.filter((r: any) => r.score < 80).length;
    
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Liczba audytów: ${records.length}`);
    doc.text(`Średni wynik: ${avgScore.toFixed(1)}%`);
    doc.text(`Zaliczone (≥80%): ${passedCount}`);
    doc.text(`Niezaliczone (<80%): ${failedCount}`);
    doc.moveDown(2);

    // Table
    doc.font('Polish-Bold').fontSize(14).text('Szczegóły audytów', { underline: true });
    doc.moveDown();

    doc.font('Polish').fontSize(9);
    let y = doc.y;
    
    doc.text('Data', 50, y);
    doc.text('Lista kontrolna', 110, y);
    doc.text('Audytor', 280, y);
    doc.text('Wynik', 370, y);
    doc.text('Status', 420, y);
    doc.text('Operator', 480, y);
    
    y += 15;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 5;

    records.forEach((record: any) => {
      if (y > 750) {
        doc.addPage();
        doc.font('Polish');
        y = 50;
      }
      doc.text(dayjs(record.auditDate).format('DD.MM.YYYY'), 50, y);
      doc.text((record.checklist?.name || '-').substring(0, 28), 110, y);
      doc.text((record.auditor || '-').substring(0, 15), 280, y);
      doc.text(`${record.score.toFixed(1)}%`, 370, y);
      doc.text(record.score >= 80 ? 'Zaliczony' : 'Niezaliczony', 420, y);
      doc.text(record.user?.name?.substring(0, 10) || '-', 480, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    console.error('Audits report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

// GET /api/reports/trainings - Raport szkoleń
router.get('/trainings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate) where.trainingDate = { ...where.trainingDate, gte: new Date(startDate as string) };
    if (endDate) where.trainingDate = { ...where.trainingDate, lte: new Date(endDate as string) };

    const trainings = await req.prisma.trainingRecord.findMany({
      where,
      include: {
        participants: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { trainingDate: 'desc' },
    });

    const doc = createPDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_szkolen_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.font('Polish-Bold').fontSize(20).text('Raport Szkoleń HACCP', { align: 'center' });
    doc.moveDown();
    doc.font('Polish').fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const totalParticipants = trainings.reduce((sum: number, t: any) => sum + (t.participants?.length || 0), 0);
    
    doc.font('Polish-Bold').fontSize(14).text('Podsumowanie', { underline: true });
    doc.font('Polish').fontSize(11);
    doc.text(`Liczba szkoleń: ${trainings.length}`);
    doc.text(`Łączna liczba uczestników: ${totalParticipants}`);
    doc.moveDown(2);

    // Details for each training
    trainings.forEach((training: any, idx: number) => {
      if (doc.y > 650) {
        doc.addPage();
        doc.font('Polish');
      }
      
      doc.font('Polish-Bold').fontSize(12);
      doc.text(`${idx + 1}. ${training.title}`);
      doc.font('Polish').fontSize(10);
      doc.text(`Data: ${dayjs(training.trainingDate).format('DD.MM.YYYY')} | Prowadzący: ${training.trainer || '-'}`);
      if (training.description) {
        doc.text(`Opis: ${training.description}`);
      }
      doc.text(`Uczestnicy (${training.participants?.length || 0}):`);
      const participantNames = training.participants?.map((p: any) => p.user?.name || '-').join(', ') || 'Brak';
      doc.fontSize(9).text(participantNames, { indent: 20 });
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Trainings report error:', error);
    res.status(500).json({ error: 'Błąd generowania raportu' });
  }
});

export default router;

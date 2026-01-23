import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

const router = Router();

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

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=raport_temperatury_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Raport Temperatury', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Okres: ${startDate || 'początek'} - ${endDate || 'teraz'}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    const compliant = readings.filter((r: any) => r.isCompliant).length;
    const nonCompliant = readings.filter((r: any) => !r.isCompliant).length;
    
    doc.fontSize(14).text('Podsumowanie', { underline: true });
    doc.fontSize(11);
    doc.text(`Liczba pomiarów: ${readings.length}`);
    doc.text(`Zgodne: ${compliant} (${readings.length > 0 ? ((compliant/readings.length)*100).toFixed(1) : 0}%)`);
    doc.text(`Niezgodne: ${nonCompliant} (${readings.length > 0 ? ((nonCompliant/readings.length)*100).toFixed(1) : 0}%)`);
    doc.moveDown(2);

    // Table header
    doc.fontSize(14).text('Szczegóły pomiarów', { underline: true });
    doc.moveDown();
    
    // Simple table
    doc.fontSize(9);
    let y = doc.y;
    const colWidths = [100, 120, 60, 60, 100];
    
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
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=traceability_${batch.batchNumber}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Raport Traceability', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Partia: ${batch.batchNumber}`, { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // Product info
    doc.fontSize(14).text('Informacje o produkcie', { underline: true });
    doc.fontSize(11);
    doc.text(`Produkt: ${batch.product.name}`);
    doc.text(`Ilość: ${batch.quantity} ${batch.unit}`);
    doc.text(`Data produkcji: ${dayjs(batch.productionDate).format('DD.MM.YYYY')}`);
    doc.text(`Data ważności: ${dayjs(batch.expiryDate).format('DD.MM.YYYY')}`);
    doc.text(`Status: ${batch.status}`);
    doc.text(`Operator: ${batch.user.name}`);
    doc.moveDown(2);

    // Materials
    doc.fontSize(14).text('Użyte surowce', { underline: true });
    doc.moveDown();
    
    batch.materials.forEach((mat: any, index: number) => {
      doc.fontSize(11).text(`${index + 1}. ${mat.rawMaterial.name}`);
      doc.fontSize(10);
      doc.text(`   Ilość: ${mat.quantity} ${mat.unit}`);
      if (mat.reception) {
        doc.text(`   Partia surowca: ${mat.reception.batchNumber}`);
        doc.text(`   Dostawca: ${mat.reception.supplier?.name || 'N/A'}`);
        doc.text(`   Data przyjęcia: ${dayjs(mat.reception.receivedAt).format('DD.MM.YYYY')}`);
        if (mat.reception.documentNumber) {
          doc.text(`   Dokument: ${mat.reception.documentNumber}`);
        }
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

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=plan_haccp_${dayjs().format('YYYY-MM-DD')}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Plan HACCP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Masarnia MLO', { align: 'center' });
    doc.fontSize(10).text(`Wygenerowano: ${dayjs().format('DD.MM.YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // CCPs
    doc.fontSize(16).text('Krytyczne Punkty Kontroli (CCP)', { underline: true });
    doc.moveDown();

    ccps.forEach((ccp: any, index: number) => {
      doc.font('Helvetica-Bold').fontSize(12).text(`${ccp.name}`);
      doc.font('Helvetica').fontSize(10);
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
    doc.fontSize(16).text('Analiza Zagrożeń', { underline: true });
    doc.moveDown();

    hazards.forEach((hazard: any) => {
      doc.font('Helvetica-Bold').fontSize(11).text(`${hazard.name} (${hazard.type})`);
      doc.font('Helvetica').fontSize(10);
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

export default router;

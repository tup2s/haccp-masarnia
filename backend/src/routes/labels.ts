import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import * as net from 'net';
import dayjs from 'dayjs';

const router = Router();
const prisma = new PrismaClient();

// Generuj komendę EZPL dla drukarki Godex
function generateEZPL(data: {
  batchNumber: string;
  productName: string;
  meatDescription?: string;
  quantity: string;
  startDate: string;
  endDate: string;
  companyName: string;
  labelWidth: number;
  labelHeight: number;
}): string {
  // EZPL/GODEX command format
  // Rozmiar w punktach (8 punktów = 1mm dla 203 DPI)
  const widthDots = data.labelWidth * 8;
  const heightDots = data.labelHeight * 8;
  
  // Buduj komendę EZPL
  let ezpl = '';
  
  // Inicjalizacja
  ezpl += '^Q' + heightDots + ',3\n';  // Wysokość etykiety
  ezpl += '^W' + widthDots + '\n';      // Szerokość etykiety
  ezpl += '^H10\n';                      // Ciemność druku
  ezpl += '^P1\n';                       // Ilość kopii
  ezpl += '^S3\n';                       // Prędkość
  ezpl += '^AT\n';                       // Tryb tekstowy
  ezpl += '^C1\n';                       // Kodowanie
  ezpl += '^R0\n';                       // Rotacja
  ezpl += '~Q+0\n';                      // Offset
  ezpl += '^O0\n';                       // Orientacja
  ezpl += '^D0\n';                       // Kierunek
  ezpl += '^E12\n';                      // Gap
  ezpl += '~R200\n';                     // Referenacja
  ezpl += '^L\n';                        // Początek etykiety
  
  // Numer partii - duża czcionka
  ezpl += 'AD,24,12,1,1,0,0,Partia: ' + data.batchNumber + '\n';
  
  // Nazwa produktu
  ezpl += 'AD,48,12,1,1,0,0,' + data.productName.substring(0, 30) + '\n';
  
  // Co jest peklowane (jeśli podano)
  if (data.meatDescription) {
    ezpl += 'AD,72,12,1,1,0,0,' + data.meatDescription.substring(0, 35) + '\n';
  }
  
  // Ilość
  ezpl += 'AD,96,12,1,1,0,0,Ilosc: ' + data.quantity + '\n';
  
  // Data rozpoczęcia
  ezpl += 'AD,120,12,1,1,0,0,Start: ' + data.startDate + '\n';
  
  // Data zakończenia
  ezpl += 'AD,144,12,1,1,0,0,Koniec: ' + data.endDate + '\n';
  
  // Nazwa firmy (mniejsza czcionka na dole)
  ezpl += 'AD,180,8,1,1,0,0,' + data.companyName.substring(0, 40) + '\n';
  
  // Kod kreskowy z numerem partii
  ezpl += 'B' + Math.round(widthDots/2 - 50) + ',200,0,1,2,4,48,B,' + data.batchNumber.replace(/-/g, '') + '\n';
  
  // Koniec etykiety
  ezpl += 'E\n';
  
  return ezpl;
}

// Wyślij komendę do drukarki przez TCP
async function sendToPrinter(ip: string, port: number, command: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(5000);
    
    client.connect(port, ip, () => {
      client.write(command, 'utf8', (err) => {
        if (err) {
          client.destroy();
          reject(err);
        } else {
          client.end();
          resolve(true);
        }
      });
    });
    
    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Timeout połączenia z drukarką'));
    });
    
    client.on('close', () => {
      resolve(true);
    });
  });
}

// POST /api/labels/print/curing/:id - Drukuj etykietę partii peklowania
router.post('/print/curing/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { copies = 1 } = req.body;
    
    // Pobierz ustawienia drukarki
    const settings = await prisma.companySettings.findFirst();
    if (!settings?.printerIp) {
      return res.status(400).json({ 
        error: 'Drukarka nie skonfigurowana. Ustaw adres IP drukarki w Ustawieniach.' 
      });
    }
    
    // Pobierz partię peklowania
    const batch = await prisma.curingBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          }
        }
      }
    });
    
    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }
    
    // Generuj komendę EZPL
    const command = generateEZPL({
      batchNumber: batch.batchNumber,
      productName: batch.reception?.rawMaterial?.name || 'Mięso',
      meatDescription: batch.meatDescription || undefined,
      quantity: `${batch.quantity} ${batch.unit}`,
      startDate: dayjs(batch.startDate).format('DD.MM.YYYY'),
      endDate: dayjs(batch.plannedEndDate).format('DD.MM.YYYY'),
      companyName: settings.companyName || 'Masarnia',
      labelWidth: settings.labelWidth || 60,
      labelHeight: settings.labelHeight || 40,
    });
    
    // Wyślij do drukarki
    try {
      for (let i = 0; i < copies; i++) {
        await sendToPrinter(settings.printerIp, settings.printerPort || 9100, command);
      }
      
      res.json({ 
        success: true, 
        message: `Wydrukowano ${copies} etykiet(y) dla partii ${batch.batchNumber}` 
      });
    } catch (printError: any) {
      console.error('Błąd drukowania:', printError);
      res.status(500).json({ 
        error: `Błąd połączenia z drukarką: ${printError.message}`,
        printerIp: settings.printerIp,
        printerPort: settings.printerPort
      });
    }
    
  } catch (error) {
    console.error('Error printing label:', error);
    res.status(500).json({ error: 'Błąd drukowania etykiety' });
  }
});

// GET /api/labels/preview/curing/:id - Podgląd komendy etykiety (do debugowania)
router.get('/preview/curing/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.companySettings.findFirst();
    
    const batch = await prisma.curingBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reception: {
          include: {
            rawMaterial: true,
          }
        }
      }
    });
    
    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }
    
    const command = generateEZPL({
      batchNumber: batch.batchNumber,
      productName: batch.reception?.rawMaterial?.name || 'Mięso',
      meatDescription: batch.meatDescription || undefined,
      quantity: `${batch.quantity} ${batch.unit}`,
      startDate: dayjs(batch.startDate).format('DD.MM.YYYY'),
      endDate: dayjs(batch.plannedEndDate).format('DD.MM.YYYY'),
      companyName: settings?.companyName || 'Masarnia',
      labelWidth: settings?.labelWidth || 60,
      labelHeight: settings?.labelHeight || 40,
    });
    
    res.json({
      batch: {
        batchNumber: batch.batchNumber,
        product: batch.reception?.rawMaterial?.name,
        meatDescription: batch.meatDescription,
      },
      printer: {
        ip: settings?.printerIp || 'NIE USTAWIONO',
        port: settings?.printerPort || 9100,
        labelSize: `${settings?.labelWidth || 60}x${settings?.labelHeight || 40}mm`
      },
      ezplCommand: command
    });
    
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Błąd generowania podglądu' });
  }
});

// GET /api/labels/html/curing/:id - Generuj etykietę jako HTML do wydruku z przeglądarki
router.get('/html/curing/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batchId = parseInt(req.params.id);
    console.log('Generating HTML label for batch ID:', batchId);
    
    if (isNaN(batchId)) {
      return res.status(400).json({ error: 'Nieprawidłowe ID partii' });
    }
    
    const settings = await prisma.companySettings.findFirst();
    
    const batch = await prisma.curingBatch.findUnique({
      where: { id: batchId },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          }
        }
      }
    });
    
    console.log('Batch found:', batch ? batch.batchNumber : 'NOT FOUND');
    
    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }
    
    const labelWidth = settings?.labelWidth || 60;
    const labelHeight = settings?.labelHeight || 40;
    const companyName = settings?.companyName || 'Masarnia';
    const productName = batch.productName || batch.reception?.rawMaterial?.name || 'Mięso';
    const batchInfo = batch.reception?.batchNumber ? `Partia dostawy: ${batch.reception.batchNumber}` : '';
    
    // Generuj HTML etykiety gotowej do wydruku
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etykieta ${batch.batchNumber}</title>
  <style>
    @page {
      size: ${labelWidth}mm ${labelHeight}mm;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      width: ${labelWidth}mm;
      height: ${labelHeight}mm;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .batch-number {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
    }
    .product-name {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
    }
    .meat-desc {
      font-size: 8pt;
      text-align: center;
      color: #333;
    }
    .info-row {
      font-size: 8pt;
      display: flex;
      justify-content: space-between;
    }
    .dates {
      font-size: 9pt;
      display: flex;
      justify-content: space-around;
    }
    .company {
      font-size: 6pt;
      text-align: center;
      border-top: 1px solid #000;
      padding-top: 1mm;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
    .no-print {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()">🖨️ Drukuj</button>
  
  <div class="batch-number">Partia: ${batch.batchNumber}</div>
  
  <div class="product-name">${productName}</div>
  
  ${batch.meatDescription ? `<div class="meat-desc">${batch.meatDescription}</div>` : ''}
  
  ${batchInfo ? `<div class="meat-desc">${batchInfo}</div>` : ''}
  
  <div class="info-row">
    <span>Ilość: ${batch.quantity} ${batch.unit}</span>
    <span>Metoda: ${batch.curingMethod === 'DRY' ? 'Sucha' : 'Nastrzykowa'}</span>
  </div>
  
  <div class="dates">
    <span>Start: ${dayjs(batch.startDate).format('DD.MM.YYYY')}</span>
    <span>Koniec: ${dayjs(batch.plannedEndDate).format('DD.MM.YYYY')}</span>
  </div>
  
  <div class="company">${companyName}</div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error: any) {
    console.error('Error generating HTML label:', error);
    res.status(500).json({ 
      error: 'Błąd generowania etykiety HTML', 
      details: error.message || 'Nieznany błąd'
    });
  }
});

// POST /api/labels/test - Test połączenia z drukarką
router.post('/test', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.companySettings.findFirst();
    
    if (!settings?.printerIp) {
      return res.status(400).json({ error: 'Adres IP drukarki nie jest ustawiony' });
    }
    
    // Prosta komenda testowa
    const testCommand = '^L\nAD,50,12,1,1,0,0,TEST DRUKARKI\nE\n';
    
    try {
      await sendToPrinter(settings.printerIp, settings.printerPort || 9100, testCommand);
      res.json({ success: true, message: 'Połączenie z drukarką OK! Etykieta testowa wydrukowana.' });
    } catch (printError: any) {
      res.status(500).json({ 
        error: `Nie można połączyć z drukarką: ${printError.message}`,
        printerIp: settings.printerIp,
        printerPort: settings.printerPort
      });
    }
    
  } catch (error) {
    console.error('Error testing printer:', error);
    res.status(500).json({ error: 'Błąd testu drukarki' });
  }
});

export default router;

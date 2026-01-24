import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/settings - pobierz ustawienia firmy
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await prisma.companySettings.findFirst();
    
    // Jeśli nie ma jeszcze ustawień, utwórz domyślne
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: '',
          address: '',
          nip: '',
          vetNumber: '',
          phone: '',
          email: '',
          ownerName: ''
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Błąd podczas pobierania ustawień:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania ustawień' });
  }
});

// PUT /api/settings - aktualizuj ustawienia firmy
router.put('/', authenticateToken, async (req, res) => {
  try {
    const authReq = req as any;
    
    // Tylko admin może edytować ustawienia
    if (authReq.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Brak uprawnień do edycji ustawień' });
    }

    const { 
      companyName, address, nip, vetNumber, phone, email, ownerName,
      printerIp, printerPort, labelWidth, labelHeight
    } = req.body;

    let settings = await prisma.companySettings.findFirst();
    
    const data = {
      companyName: companyName || '',
      address: address || '',
      nip: nip || '',
      vetNumber: vetNumber || '',
      phone: phone || '',
      email: email || '',
      ownerName: ownerName || '',
      printerIp: printerIp || '',
      printerPort: printerPort || 9100,
      labelWidth: labelWidth || 60,
      labelHeight: labelHeight || 40,
    };

    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.companySettings.create({ data });
    }

    res.json(settings);
  } catch (error) {
    console.error('Błąd podczas aktualizacji ustawień:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji ustawień' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// TYPY ODPADÓW (WasteType)
// ============================================

// GET - pobierz wszystkie typy odpadów
router.get('/types', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const types = await prisma.wasteType.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { wasteRecords: true }
        }
      }
    });
    res.json(types);
  } catch (error) {
    console.error('Error fetching waste types:', error);
    res.status(500).json({ error: 'Błąd pobierania typów odpadów' });
  }
});

// GET - pobierz aktywne typy odpadów
router.get('/types/active', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const types = await prisma.wasteType.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json(types);
  } catch (error) {
    console.error('Error fetching active waste types:', error);
    res.status(500).json({ error: 'Błąd pobierania typów odpadów' });
  }
});

// POST - dodaj nowy typ odpadu
router.post('/types', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, category, code, description, unit } = req.body;
    
    const type = await prisma.wasteType.create({
      data: {
        name,
        category,
        code,
        description,
        unit: unit || 'kg'
      }
    });
    
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating waste type:', error);
    res.status(500).json({ error: 'Błąd tworzenia typu odpadu' });
  }
});

// PUT - aktualizuj typ odpadu
router.put('/types/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, code, description, unit, isActive } = req.body;
    
    const type = await prisma.wasteType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        category,
        code,
        description,
        unit,
        isActive
      }
    });
    
    res.json(type);
  } catch (error) {
    console.error('Error updating waste type:', error);
    res.status(500).json({ error: 'Błąd aktualizacji typu odpadu' });
  }
});

// DELETE - usuń typ odpadu
router.delete('/types/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const recordsCount = await prisma.wasteRecord.count({
      where: { wasteTypeId: parseInt(id) }
    });
    
    if (recordsCount > 0) {
      await prisma.wasteType.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      res.json({ message: 'Typ odpadu dezaktywowany (ma powiązane rekordy)' });
    } else {
      await prisma.wasteType.delete({
        where: { id: parseInt(id) }
      });
      res.json({ message: 'Typ odpadu usunięty' });
    }
  } catch (error) {
    console.error('Error deleting waste type:', error);
    res.status(500).json({ error: 'Błąd usuwania typu odpadu' });
  }
});

// ============================================
// FIRMY ODBIERAJĄCE (WasteCollector)
// ============================================

// GET - pobierz wszystkie firmy odbierające
router.get('/collectors', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const collectors = await prisma.wasteCollector.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { wasteRecords: true }
        }
      }
    });
    res.json(collectors);
  } catch (error) {
    console.error('Error fetching waste collectors:', error);
    res.status(500).json({ error: 'Błąd pobierania firm odbierających' });
  }
});

// GET - pobierz aktywne firmy odbierające
router.get('/collectors/active', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const collectors = await prisma.wasteCollector.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(collectors);
  } catch (error) {
    console.error('Error fetching active waste collectors:', error);
    res.status(500).json({ error: 'Błąd pobierania firm odbierających' });
  }
});

// POST - dodaj nową firmę odbierającą
router.post('/collectors', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email, vetNumber, contractNumber, contactPerson } = req.body;
    
    const collector = await prisma.wasteCollector.create({
      data: {
        name,
        address,
        phone,
        email,
        vetNumber,
        contractNumber,
        contactPerson
      }
    });
    
    res.status(201).json(collector);
  } catch (error) {
    console.error('Error creating waste collector:', error);
    res.status(500).json({ error: 'Błąd tworzenia firmy odbierającej' });
  }
});

// PUT - aktualizuj firmę odbierającą
router.put('/collectors/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, vetNumber, contractNumber, contactPerson, isActive } = req.body;
    
    const collector = await prisma.wasteCollector.update({
      where: { id: parseInt(id) },
      data: {
        name,
        address,
        phone,
        email,
        vetNumber,
        contractNumber,
        contactPerson,
        isActive
      }
    });
    
    res.json(collector);
  } catch (error) {
    console.error('Error updating waste collector:', error);
    res.status(500).json({ error: 'Błąd aktualizacji firmy odbierającej' });
  }
});

// DELETE - usuń firmę odbierającą
router.delete('/collectors/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const recordsCount = await prisma.wasteRecord.count({
      where: { collectorId: parseInt(id) }
    });
    
    if (recordsCount > 0) {
      await prisma.wasteCollector.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      res.json({ message: 'Firma dezaktywowana (ma powiązane odbiory)' });
    } else {
      await prisma.wasteCollector.delete({
        where: { id: parseInt(id) }
      });
      res.json({ message: 'Firma usunięta' });
    }
  } catch (error) {
    console.error('Error deleting waste collector:', error);
    res.status(500).json({ error: 'Błąd usuwania firmy odbierającej' });
  }
});

// ============================================
// EWIDENCJA ODPADÓW (WasteRecord)
// ============================================

// GET - pobierz wszystkie rekordy odpadów
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { typeId, collectorId, from, to } = req.query;
    
    const where: any = {};
    
    if (typeId) {
      where.wasteTypeId = parseInt(typeId as string);
    }
    
    if (collectorId) {
      where.collectorId = parseInt(collectorId as string);
    }
    
    if (from || to) {
      where.collectionDate = {};
      if (from) where.collectionDate.gte = new Date(from as string);
      if (to) where.collectionDate.lte = new Date(to as string);
    }
    
    const records = await prisma.wasteRecord.findMany({
      where,
      include: {
        wasteType: true,
        collector: true
      },
      orderBy: { collectionDate: 'desc' }
    });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching waste records:', error);
    res.status(500).json({ error: 'Błąd pobierania ewidencji odpadów' });
  }
});

// GET - pobierz pojedynczy rekord
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const record = await prisma.wasteRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        wasteType: true,
        collector: true
      }
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Rekord nie znaleziony' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error fetching waste record:', error);
    res.status(500).json({ error: 'Błąd pobierania rekordu' });
  }
});

// POST - dodaj nowy rekord odpadu
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      wasteTypeId,
      collectorId,
      quantity,
      unit,
      collectionDate,
      documentNumber,
      vehicleNumber,
      driverName,
      notes
    } = req.body;
    
    const record = await prisma.wasteRecord.create({
      data: {
        wasteTypeId: parseInt(wasteTypeId),
        collectorId: collectorId ? parseInt(collectorId) : null,
        quantity: parseFloat(quantity),
        unit: unit || 'kg',
        collectionDate: collectionDate ? new Date(collectionDate) : new Date(),
        documentNumber,
        vehicleNumber,
        driverName,
        notes
      },
      include: {
        wasteType: true,
        collector: true
      }
    });
    
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating waste record:', error);
    res.status(500).json({ error: 'Błąd tworzenia rekordu odpadu' });
  }
});

// PUT - aktualizuj rekord odpadu
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      wasteTypeId,
      collectorId,
      quantity,
      unit,
      collectionDate,
      documentNumber,
      vehicleNumber,
      driverName,
      notes
    } = req.body;
    
    const record = await prisma.wasteRecord.update({
      where: { id: parseInt(id) },
      data: {
        wasteTypeId: wasteTypeId ? parseInt(wasteTypeId) : undefined,
        collectorId: collectorId !== undefined ? (collectorId ? parseInt(collectorId) : null) : undefined,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit,
        collectionDate: collectionDate ? new Date(collectionDate) : undefined,
        documentNumber,
        vehicleNumber,
        driverName,
        notes
      },
      include: {
        wasteType: true,
        collector: true
      }
    });
    
    res.json(record);
  } catch (error) {
    console.error('Error updating waste record:', error);
    res.status(500).json({ error: 'Błąd aktualizacji rekordu' });
  }
});

// DELETE - usuń rekord odpadu
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.wasteRecord.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Rekord usunięty' });
  } catch (error) {
    console.error('Error deleting waste record:', error);
    res.status(500).json({ error: 'Błąd usuwania rekordu' });
  }
});

// GET - statystyki odpadów
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    const where: any = {};
    if (from || to) {
      where.collectionDate = {};
      if (from) where.collectionDate.gte = new Date(from as string);
      if (to) where.collectionDate.lte = new Date(to as string);
    }
    
    const records = await prisma.wasteRecord.findMany({
      where,
      include: {
        wasteType: true
      }
    });
    
    // Suma wg kategorii
    const byCategory: Record<string, number> = {};
    records.forEach(r => {
      const cat = r.wasteType.category;
      byCategory[cat] = (byCategory[cat] || 0) + r.quantity;
    });
    
    // Suma wg typu
    const byType: Record<string, number> = {};
    records.forEach(r => {
      const name = r.wasteType.name;
      byType[name] = (byType[name] || 0) + r.quantity;
    });
    
    const total = records.reduce((sum, r) => sum + r.quantity, 0);
    
    res.json({
      total,
      recordsCount: records.length,
      byCategory,
      byType
    });
  } catch (error) {
    console.error('Error fetching waste stats:', error);
    res.status(500).json({ error: 'Błąd pobierania statystyk' });
  }
});

export default router;

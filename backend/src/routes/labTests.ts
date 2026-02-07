import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// TYPY BADAŃ (LabTestType)
// ============================================

// GET - pobierz wszystkie typy badań
router.get('/types', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const types = await prisma.labTestType.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { labTests: true }
        }
      }
    });
    res.json(types);
  } catch (error) {
    console.error('Error fetching lab test types:', error);
    res.status(500).json({ error: 'Błąd pobierania typów badań' });
  }
});

// GET - pobierz aktywne typy badań
router.get('/types/active', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const types = await prisma.labTestType.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json(types);
  } catch (error) {
    console.error('Error fetching active lab test types:', error);
    res.status(500).json({ error: 'Błąd pobierania typów badań' });
  }
});

// POST - dodaj nowy typ badania
router.post('/types', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, category, unit, normMin, normMax, normText, frequency, description } = req.body;
    
    const type = await prisma.labTestType.create({
      data: {
        name,
        category,
        unit,
        normMin: normMin ? parseFloat(normMin) : null,
        normMax: normMax ? parseFloat(normMax) : null,
        normText,
        frequency,
        description
      }
    });
    
    res.status(201).json(type);
  } catch (error) {
    console.error('Error creating lab test type:', error);
    res.status(500).json({ error: 'Błąd tworzenia typu badania' });
  }
});

// PUT - aktualizuj typ badania
router.put('/types/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, unit, normMin, normMax, normText, frequency, description, isActive } = req.body;
    
    const type = await prisma.labTestType.update({
      where: { id: parseInt(id) },
      data: {
        name,
        category,
        unit,
        normMin: normMin !== undefined ? (normMin ? parseFloat(normMin) : null) : undefined,
        normMax: normMax !== undefined ? (normMax ? parseFloat(normMax) : null) : undefined,
        normText,
        frequency,
        description,
        isActive
      }
    });
    
    res.json(type);
  } catch (error) {
    console.error('Error updating lab test type:', error);
    res.status(500).json({ error: 'Błąd aktualizacji typu badania' });
  }
});

// DELETE - usuń typ badania
router.delete('/types/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy są powiązane badania
    const testsCount = await prisma.labTest.count({
      where: { labTestTypeId: parseInt(id) }
    });
    
    if (testsCount > 0) {
      // Zamiast usuwać, dezaktywuj
      await prisma.labTestType.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      res.json({ message: 'Typ badania dezaktywowany (ma powiązane wyniki)' });
    } else {
      await prisma.labTestType.delete({
        where: { id: parseInt(id) }
      });
      res.json({ message: 'Typ badania usunięty' });
    }
  } catch (error) {
    console.error('Error deleting lab test type:', error);
    res.status(500).json({ error: 'Błąd usuwania typu badania' });
  }
});

// ============================================
// WYNIKI BADAŃ (LabTest)
// ============================================

// GET - pobierz wszystkie badania
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { typeId, from, to, compliant } = req.query;
    
    const where: any = {};
    
    if (typeId) {
      where.labTestTypeId = parseInt(typeId as string);
    }
    
    if (from || to) {
      where.sampleDate = {};
      if (from) where.sampleDate.gte = new Date(from as string);
      if (to) where.sampleDate.lte = new Date(to as string);
    }
    
    if (compliant !== undefined && compliant !== '') {
      where.isCompliant = compliant === 'true';
    }
    
    const tests = await prisma.labTest.findMany({
      where,
      include: {
        labTestType: true
      },
      orderBy: { sampleDate: 'desc' }
    });
    
    res.json(tests);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'Błąd pobierania badań' });
  }
});

// GET - pobierz pojedyncze badanie
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const test = await prisma.labTest.findUnique({
      where: { id: parseInt(id) },
      include: {
        labTestType: true
      }
    });
    
    if (!test) {
      return res.status(404).json({ error: 'Badanie nie znalezione' });
    }
    
    res.json(test);
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ error: 'Błąd pobierania badania' });
  }
});

// POST - dodaj nowe badanie
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      labTestTypeId,
      sampleDate,
      resultDate,
      sampleSource,
      sampleBatchId,
      result,
      resultValue,
      isCompliant,
      laboratory,
      documentNumber,
      notes
    } = req.body;
    
    const test = await prisma.labTest.create({
      data: {
        labTestTypeId: parseInt(labTestTypeId),
        sampleDate: sampleDate ? new Date(sampleDate) : new Date(),
        resultDate: resultDate ? new Date(resultDate) : null,
        sampleSource,
        sampleBatchId,
        result,
        resultValue: resultValue ? parseFloat(resultValue) : null,
        isCompliant: isCompliant !== undefined ? isCompliant : null,
        laboratory,
        documentNumber,
        notes
      },
      include: {
        labTestType: true
      }
    });
    
    res.status(201).json(test);
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({ error: 'Błąd tworzenia badania' });
  }
});

// PUT - aktualizuj badanie
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      labTestTypeId,
      sampleDate,
      resultDate,
      sampleSource,
      sampleBatchId,
      result,
      resultValue,
      isCompliant,
      laboratory,
      documentNumber,
      notes
    } = req.body;
    
    const test = await prisma.labTest.update({
      where: { id: parseInt(id) },
      data: {
        labTestTypeId: labTestTypeId ? parseInt(labTestTypeId) : undefined,
        sampleDate: sampleDate ? new Date(sampleDate) : undefined,
        resultDate: resultDate ? new Date(resultDate) : null,
        sampleSource,
        sampleBatchId,
        result,
        resultValue: resultValue !== undefined ? (resultValue ? parseFloat(resultValue) : null) : undefined,
        isCompliant: isCompliant !== undefined ? isCompliant : undefined,
        laboratory,
        documentNumber,
        notes
      },
      include: {
        labTestType: true
      }
    });
    
    res.json(test);
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: 'Błąd aktualizacji badania' });
  }
});

// DELETE - usuń badanie
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.labTest.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Badanie usunięte' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ error: 'Błąd usuwania badania' });
  }
});

// GET - statystyki badań
router.get('/stats/summary', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const total = await prisma.labTest.count();
    const compliant = await prisma.labTest.count({ where: { isCompliant: true } });
    const nonCompliant = await prisma.labTest.count({ where: { isCompliant: false } });
    const pending = await prisma.labTest.count({ where: { isCompliant: null } });
    
    const byCategory = await prisma.labTest.groupBy({
      by: ['labTestTypeId'],
      _count: true
    });
    
    res.json({
      total,
      compliant,
      nonCompliant,
      pending,
      complianceRate: total > 0 ? ((compliant / (total - pending)) * 100).toFixed(1) : 0,
      byCategory
    });
  } catch (error) {
    console.error('Error fetching lab test stats:', error);
    res.status(500).json({ error: 'Błąd pobierania statystyk' });
  }
});

export default router;

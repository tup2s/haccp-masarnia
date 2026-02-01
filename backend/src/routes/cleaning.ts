import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/cleaning/areas
router.get('/areas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const areas = await req.prisma.cleaningArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania obszarów mycia' });
  }
});

// POST /api/cleaning/areas
router.post('/areas', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, frequency, method, chemicals } = req.body;
    const area = await req.prisma.cleaningArea.create({
      data: { name, location, frequency, method, chemicals },
    });
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia obszaru mycia' });
  }
});

// PUT /api/cleaning/areas/:id
router.put('/areas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, frequency, method, chemicals, isActive } = req.body;
    const area = await req.prisma.cleaningArea.update({
      where: { id: parseInt(req.params.id) },
      data: { name, location, frequency, method, chemicals, isActive },
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji obszaru mycia' });
  }
});

// DELETE /api/cleaning/areas/:id
router.delete('/areas/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.cleaningArea.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania obszaru mycia' });
  }
});

// GET /api/cleaning/records
router.get('/records', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { areaId, limit = 50 } = req.query;
    const where: any = {};
    if (areaId) where.cleaningAreaId = parseInt(areaId as string);

    const records = await req.prisma.cleaningRecord.findMany({
      where,
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
      orderBy: { cleanedAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zapisów mycia' });
  }
});

// POST /api/cleaning/records
router.post('/records', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { cleaningAreaId, method, chemicals, isVerified, notes } = req.body;
    const record = await req.prisma.cleaningRecord.create({
      data: {
        cleaningAreaId,
        method,
        chemicals,
        isVerified,
        notes,
        userId: req.userId!,
      },
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia zapisu mycia' });
  }
});

// PUT /api/cleaning/records/:id - Admin może edytować
router.put('/records/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { method, chemicals, isVerified, notes } = req.body;
    const record = await req.prisma.cleaningRecord.update({
      where: { id: parseInt(req.params.id) },
      data: { method, chemicals, isVerified, notes },
      include: {
        cleaningArea: true,
        user: { select: { name: true } },
      },
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji zapisu mycia' });
  }
});

// DELETE /api/cleaning/records/:id - Admin może usuwać
router.delete('/records/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.cleaningRecord.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania zapisu mycia' });
  }
});

export default router;

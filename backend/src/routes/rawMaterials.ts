import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/raw-materials
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const materials = await req.prisma.rawMaterial.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania surowców' });
  }
});

// GET /api/raw-materials/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const material = await req.prisma.rawMaterial.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supplier: true, receptions: { take: 10, orderBy: { receivedAt: 'desc' } } },
    });
    if (!material) {
      return res.status(404).json({ error: 'Surowiec nie znaleziony' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania surowca' });
  }
});

// POST /api/raw-materials
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, unit, supplierId, storageConditions, shelfLife, allergens } = req.body;
    const material = await req.prisma.rawMaterial.create({
      data: { name, category, unit, supplierId, storageConditions, shelfLife, allergens },
      include: { supplier: true },
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia surowca' });
  }
});

// PUT /api/raw-materials/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, unit, supplierId, storageConditions, shelfLife, allergens } = req.body;
    const material = await req.prisma.rawMaterial.update({
      where: { id: parseInt(req.params.id) },
      data: { name, category, unit, supplierId, storageConditions, shelfLife, allergens },
      include: { supplier: true },
    });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji surowca' });
  }
});

// DELETE /api/raw-materials/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.rawMaterial.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania surowca' });
  }
});

export default router;

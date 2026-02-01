import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/products
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const products = await req.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania produktów' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const product = await req.prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { productionBatches: { take: 10, orderBy: { productionDate: 'desc' } } },
    });
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania produktu' });
  }
});

// POST /api/products
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, description, unit, shelfLife, storageTemp, allergens } = req.body;
    const product = await req.prisma.product.create({
      data: { name, category, description, unit, shelfLife, storageTemp, allergens },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia produktu' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, description, unit, shelfLife, storageTemp, allergens, isActive } = req.body;
    const product = await req.prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { name, category, description, unit, shelfLife, storageTemp, allergens, isActive },
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji produktu' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania produktu' });
  }
});

export default router;

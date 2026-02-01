import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/suppliers
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await req.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania dostawców' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await req.prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { rawMaterials: true },
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Dostawca nie znaleziony' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania dostawcy' });
  }
});

// POST /api/suppliers
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone, email, vetNumber, contactPerson, notes } = req.body;
    const supplier = await req.prisma.supplier.create({
      data: { name, address, phone, email, vetNumber, contactPerson, notes },
    });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia dostawcy' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone, email, vetNumber, contactPerson, isApproved, notes } = req.body;
    const supplier = await req.prisma.supplier.update({
      where: { id: parseInt(req.params.id) },
      data: { name, address, phone, email, vetNumber, contactPerson, isApproved, notes },
    });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji dostawcy' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.supplier.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania dostawcy' });
  }
});

export default router;

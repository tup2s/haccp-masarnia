import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// GET /api/documents
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;
    const where: any = {};
    if (category) where.category = category;

    const documents = await req.prisma.document.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania dokumentów' });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const document = await req.prisma.document.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { name: true } },
      },
    });
    if (!document) {
      return res.status(404).json({ error: 'Dokument nie znaleziony' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania dokumentu' });
  }
});

// POST /api/documents
router.post('/', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, fileName, filePath, version, validFrom, validUntil } = req.body;
    const document = await req.prisma.document.create({
      data: {
        title,
        category,
        fileName,
        filePath,
        version: version || '1.0',
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        uploadedBy: req.userId!,
      },
      include: {
        user: { select: { name: true } },
      },
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia dokumentu' });
  }
});

// PUT /api/documents/:id
router.put('/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, fileName, filePath, version, validFrom, validUntil } = req.body;
    const document = await req.prisma.document.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        category,
        fileName,
        filePath,
        version,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        user: { select: { name: true } },
      },
    });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji dokumentu' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.document.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania dokumentu' });
  }
});

export default router;

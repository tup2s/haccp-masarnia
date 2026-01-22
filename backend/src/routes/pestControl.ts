import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/pest-control/points
router.get('/points', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const points = await req.prisma.pestControlPoint.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania punktów DDD' });
  }
});

// POST /api/pest-control/points
router.post('/points', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, type } = req.body;
    const point = await req.prisma.pestControlPoint.create({
      data: { name, location, type },
    });
    res.status(201).json(point);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia punktu DDD' });
  }
});

// PUT /api/pest-control/points/:id
router.put('/points/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, type, isActive } = req.body;
    const point = await req.prisma.pestControlPoint.update({
      where: { id: parseInt(req.params.id) },
      data: { name, location, type, isActive },
    });
    res.json(point);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji punktu DDD' });
  }
});

// DELETE /api/pest-control/points/:id
router.delete('/points/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.pestControlPoint.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania punktu DDD' });
  }
});

// GET /api/pest-control/checks
router.get('/checks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pointId, limit = 50 } = req.query;
    const where: any = {};
    if (pointId) where.pestControlPointId = parseInt(pointId as string);

    const checks = await req.prisma.pestControlCheck.findMany({
      where,
      include: {
        pestControlPoint: true,
        user: { select: { name: true } },
      },
      orderBy: { checkedAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(checks);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania kontroli DDD' });
  }
});

// POST /api/pest-control/checks
router.post('/checks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pestControlPointId, status, findings, actionTaken } = req.body;
    const check = await req.prisma.pestControlCheck.create({
      data: {
        pestControlPointId,
        status,
        findings,
        actionTaken,
        userId: req.userId!,
      },
      include: {
        pestControlPoint: true,
        user: { select: { name: true } },
      },
    });

    // Create corrective action if activity detected
    if (status === 'ACTIVITY_DETECTED' || status === 'REQUIRES_SERVICE') {
      const point = await req.prisma.pestControlPoint.findUnique({
        where: { id: pestControlPointId },
      });
      await req.prisma.correctiveAction.create({
        data: {
          title: `Wykryto aktywność szkodników - ${point?.name}`,
          description: findings || 'Wymaga interwencji firmy DDD',
          priority: status === 'REQUIRES_SERVICE' ? 'CRITICAL' : 'HIGH',
          userId: req.userId!,
        },
      });
    }

    res.status(201).json(check);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia kontroli DDD' });
  }
});

export default router;

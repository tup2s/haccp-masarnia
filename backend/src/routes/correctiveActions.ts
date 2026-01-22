import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/corrective-actions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const actions = await req.prisma.correctiveAction.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania działań korygujących' });
  }
});

// GET /api/corrective-actions/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const action = await req.prisma.correctiveAction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { name: true } },
      },
    });
    if (!action) {
      return res.status(404).json({ error: 'Działanie korygujące nie znalezione' });
    }
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania działania korygującego' });
  }
});

// POST /api/corrective-actions
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, cause, actionTaken, priority, dueDate, relatedCcpId } = req.body;
    const action = await req.prisma.correctiveAction.create({
      data: {
        title,
        description,
        cause,
        actionTaken,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        relatedCcpId,
        userId: req.userId!,
      },
      include: {
        user: { select: { name: true } },
      },
    });
    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia działania korygującego' });
  }
});

// PUT /api/corrective-actions/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, cause, actionTaken, status, priority, dueDate, completedAt } = req.body;
    
    const updateData: any = {
      title,
      description,
      cause,
      actionTaken,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    // Set completedAt when status changes to COMPLETED
    if (status === 'COMPLETED' && !completedAt) {
      updateData.completedAt = new Date();
    } else if (completedAt) {
      updateData.completedAt = new Date(completedAt);
    }

    const action = await req.prisma.correctiveAction.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        user: { select: { name: true } },
      },
    });
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji działania korygującego' });
  }
});

// DELETE /api/corrective-actions/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.correctiveAction.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania działania korygującego' });
  }
});

export default router;

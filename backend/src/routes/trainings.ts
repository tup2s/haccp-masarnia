import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// GET /api/trainings
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const trainings = await req.prisma.trainingRecord.findMany({
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { trainingDate: 'desc' },
    });
    res.json(trainings);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania szkoleń' });
  }
});

// GET /api/trainings/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const training = await req.prisma.trainingRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!training) {
      return res.status(404).json({ error: 'Szkolenie nie znalezione' });
    }
    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania szkolenia' });
  }
});

// POST /api/trainings
router.post('/', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, description, trainer, trainingDate, validUntil, participantIds } = req.body;
    
    const training = await req.prisma.trainingRecord.create({
      data: {
        title,
        type,
        description,
        trainer,
        trainingDate: new Date(trainingDate),
        validUntil: validUntil ? new Date(validUntil) : null,
        participants: participantIds ? {
          create: participantIds.map((userId: number) => ({
            userId,
            passed: true,
          })),
        } : undefined,
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.status(201).json(training);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia szkolenia' });
  }
});

// PUT /api/trainings/:id
router.put('/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, description, trainer, trainingDate, validUntil } = req.body;
    const training = await req.prisma.trainingRecord.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        type,
        description,
        trainer,
        trainingDate: trainingDate ? new Date(trainingDate) : undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    res.json(training);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji szkolenia' });
  }
});

// DELETE /api/trainings/:id
router.delete('/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    // Delete participants first
    await req.prisma.trainingParticipant.deleteMany({
      where: { trainingId: parseInt(req.params.id) },
    });
    await req.prisma.trainingRecord.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania szkolenia' });
  }
});

// POST /api/trainings/:id/participants
router.post('/:id/participants', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, passed = true, notes } = req.body;
    const participant = await req.prisma.trainingParticipant.create({
      data: {
        trainingId: parseInt(req.params.id),
        userId,
        passed,
        notes,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(participant);
  } catch (error) {
    res.status(500).json({ error: 'Błąd dodawania uczestnika' });
  }
});

export default router;

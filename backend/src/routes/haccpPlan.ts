import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// GET /api/haccp-plan/ccps
router.get('/ccps', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const ccps = await req.prisma.cCP.findMany({
      where: { isActive: true },
      include: {
        temperaturePoints: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(ccps);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania punktów CCP' });
  }
});

// POST /api/haccp-plan/ccps
router.post('/ccps', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, 
      description, 
      hazardType, 
      criticalLimit, 
      monitoringMethod, 
      monitoringFrequency, 
      correctiveAction, 
      verificationMethod, 
      recordKeeping 
    } = req.body;
    
    const ccp = await req.prisma.cCP.create({
      data: {
        name,
        description,
        hazardType,
        criticalLimit,
        monitoringMethod,
        monitoringFrequency,
        correctiveAction,
        verificationMethod,
        recordKeeping,
      },
    });
    res.status(201).json(ccp);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia punktu CCP' });
  }
});

// PUT /api/haccp-plan/ccps/:id
router.put('/ccps/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      name, 
      description, 
      hazardType, 
      criticalLimit, 
      monitoringMethod, 
      monitoringFrequency, 
      correctiveAction, 
      verificationMethod, 
      recordKeeping,
      isActive 
    } = req.body;
    
    const ccp = await req.prisma.cCP.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        hazardType,
        criticalLimit,
        monitoringMethod,
        monitoringFrequency,
        correctiveAction,
        verificationMethod,
        recordKeeping,
        isActive,
      },
    });
    res.json(ccp);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji punktu CCP' });
  }
});

// DELETE /api/haccp-plan/ccps/:id
router.delete('/ccps/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.cCP.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania punktu CCP' });
  }
});

// GET /api/haccp-plan/hazards
router.get('/hazards', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const hazards = await req.prisma.hazard.findMany({
      orderBy: [{ significance: 'desc' }, { name: 'asc' }],
    });
    res.json(hazards);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zagrożeń' });
  }
});

// POST /api/haccp-plan/hazards
router.post('/hazards', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, source, preventiveMeasure, significance, processStep } = req.body;
    const hazard = await req.prisma.hazard.create({
      data: { name, type, source, preventiveMeasure, significance, processStep },
    });
    res.status(201).json(hazard);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia zagrożenia' });
  }
});

// PUT /api/haccp-plan/hazards/:id
router.put('/hazards/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, source, preventiveMeasure, significance, processStep } = req.body;
    const hazard = await req.prisma.hazard.update({
      where: { id: parseInt(req.params.id) },
      data: { name, type, source, preventiveMeasure, significance, processStep },
    });
    res.json(hazard);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji zagrożenia' });
  }
});

// DELETE /api/haccp-plan/hazards/:id
router.delete('/hazards/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.hazard.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania zagrożenia' });
  }
});

export default router;

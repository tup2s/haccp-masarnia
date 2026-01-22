import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// GET /api/audits/checklists
router.get('/checklists', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const checklists = await req.prisma.auditChecklist.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    // Parse items JSON
    const parsed = checklists.map((c: any) => ({
      ...c,
      items: JSON.parse(c.items),
    }));
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania list kontrolnych' });
  }
});

// POST /api/audits/checklists
router.post('/checklists', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, items } = req.body;
    const checklist = await req.prisma.auditChecklist.create({
      data: {
        name,
        category,
        items: JSON.stringify(items),
      },
    });
    res.status(201).json({
      ...checklist,
      items: JSON.parse(checklist.items),
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia listy kontrolnej' });
  }
});

// PUT /api/audits/checklists/:id
router.put('/checklists/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, items, isActive } = req.body;
    const checklist = await req.prisma.auditChecklist.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        category,
        items: items ? JSON.stringify(items) : undefined,
        isActive,
      },
    });
    res.json({
      ...checklist,
      items: JSON.parse(checklist.items),
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji listy kontrolnej' });
  }
});

// DELETE /api/audits/checklists/:id
router.delete('/checklists/:id', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.auditChecklist.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania listy kontrolnej' });
  }
});

// GET /api/audits/records
router.get('/records', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId, limit = 50 } = req.query;
    const where: any = {};
    if (checklistId) where.checklistId = parseInt(checklistId as string);

    const records = await req.prisma.auditRecord.findMany({
      where,
      include: {
        checklist: true,
        user: { select: { name: true } },
      },
      orderBy: { auditDate: 'desc' },
      take: parseInt(limit as string),
    });
    
    // Parse results JSON
    const parsed = records.map((r: any) => ({
      ...r,
      results: JSON.parse(r.results),
      checklist: {
        ...r.checklist,
        items: JSON.parse(r.checklist.items),
      },
    }));
    
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zapisów audytu' });
  }
});

// POST /api/audits/records
router.post('/records', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { checklistId, auditor, results, findings, recommendations } = req.body;
    
    // Calculate score
    const resultsArray = Object.values(results) as boolean[];
    const passed = resultsArray.filter(r => r === true).length;
    const score = resultsArray.length > 0 ? (passed / resultsArray.length) * 100 : 0;

    const record = await req.prisma.auditRecord.create({
      data: {
        checklistId,
        auditor,
        results: JSON.stringify(results),
        score,
        findings,
        recommendations,
        userId: req.userId!,
      },
      include: {
        checklist: true,
        user: { select: { name: true } },
      },
    });

    // Create corrective action if score is low
    if (score < 80) {
      await req.prisma.correctiveAction.create({
        data: {
          title: `Niska ocena audytu - ${record.checklist.name}`,
          description: `Wynik audytu: ${score.toFixed(1)}%. ${findings || ''}`,
          priority: score < 50 ? 'CRITICAL' : 'HIGH',
          userId: req.userId!,
        },
      });
    }

    res.status(201).json({
      ...record,
      results: JSON.parse(record.results),
      checklist: {
        ...record.checklist,
        items: JSON.parse(record.checklist.items),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia zapisu audytu' });
  }
});

// GET /api/audits/records/:id
router.get('/records/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const record = await req.prisma.auditRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        checklist: true,
        user: { select: { name: true } },
      },
    });
    
    if (!record) {
      return res.status(404).json({ error: 'Zapis audytu nie znaleziony' });
    }
    
    res.json({
      ...record,
      results: JSON.parse(record.results),
      checklist: {
        ...record.checklist,
        items: JSON.parse(record.checklist.items),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania zapisu audytu' });
  }
});

export default router;

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
    const { checklistId, auditor, results, findings, recommendations, score: frontendScore } = req.body;
    
    // Calculate score - obsługa różnych formatów results
    let score = 0;
    if (typeof frontendScore === 'number') {
      // Jeśli frontend wysyła score, użyj go
      score = frontendScore;
    } else if (Array.isArray(results)) {
      // Results jako tablica obiektów {item, passed, notes}
      const passed = results.filter((r: any) => r.passed === true).length;
      score = results.length > 0 ? (passed / results.length) * 100 : 0;
    } else if (typeof results === 'object') {
      // Results jako obiekt z wartościami boolean
      const resultsArray = Object.values(results) as boolean[];
      const passed = resultsArray.filter(r => r === true).length;
      score = resultsArray.length > 0 ? (passed / resultsArray.length) * 100 : 0;
    }

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
    console.error('Error creating audit record:', error);
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

// PUT /api/audits/records/:id - Edycja audytu
router.put('/records/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { results, findings, recommendations, score: frontendScore } = req.body;
    
    // Calculate score if not provided
    let score = frontendScore;
    if (typeof score !== 'number' && results) {
      if (Array.isArray(results)) {
        const passed = results.filter((r: any) => r.passed === true).length;
        score = results.length > 0 ? (passed / results.length) * 100 : 0;
      } else if (typeof results === 'object') {
        const resultsArray = Object.values(results) as boolean[];
        const passed = resultsArray.filter(r => r === true).length;
        score = resultsArray.length > 0 ? (passed / resultsArray.length) * 100 : 0;
      }
    }

    const updateData: any = {};
    if (results !== undefined) updateData.results = JSON.stringify(results);
    if (score !== undefined) updateData.score = score;
    if (findings !== undefined) updateData.findings = findings;
    if (recommendations !== undefined) updateData.recommendations = recommendations;

    const record = await req.prisma.auditRecord.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        checklist: true,
        user: { select: { name: true } },
      },
    });

    res.json({
      ...record,
      results: JSON.parse(record.results),
      checklist: {
        ...record.checklist,
        items: JSON.parse(record.checklist.items),
      },
    });
  } catch (error) {
    console.error('Error updating audit record:', error);
    res.status(500).json({ error: 'Błąd aktualizacji zapisu audytu' });
  }
});

// DELETE /api/audits/records/:id - Usunięcie audytu
router.delete('/records/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.auditRecord.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting audit record:', error);
    res.status(500).json({ error: 'Błąd usuwania zapisu audytu' });
  }
});

export default router;

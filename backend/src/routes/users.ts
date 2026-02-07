import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/users
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await req.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Map email to login for frontend
    const mappedUsers = users.map((u: any) => ({ ...u, login: u.email }));
    res.json(mappedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    res.json({ ...user, login: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkownika' });
  }
});

// POST /api/users
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { login, password, name, role = 'EMPLOYEE' } = req.body;
    
    const existingUser = await req.prisma.user.findUnique({ where: { email: login } });
    if (existingUser) {
      return res.status(400).json({ error: 'Login już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: { email: login, password: hashedPassword, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json({ ...user, login: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia użytkownika' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { login, password, name, role } = req.body;
    const updateData: any = { email: login, name, role };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await req.prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ ...user, login: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji użytkownika' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Sprawdź czy to nie jest aktualnie zalogowany użytkownik
    if (req.userId === userId) {
      return res.status(400).json({ error: 'Nie możesz usunąć swojego własnego konta' });
    }
    
    // Sprawdź czy użytkownik ma powiązane rekordy
    const relatedRecords = await Promise.all([
      req.prisma.temperatureReading.count({ where: { userId } }),
      req.prisma.productionBatch.count({ where: { userId } }),
      req.prisma.reception.count({ where: { userId } }),
      req.prisma.cleaningRecord.count({ where: { userId } }),
      req.prisma.curingBatch.count({ where: { userId } }),
      req.prisma.pestControlCheck.count({ where: { userId } }),
      req.prisma.training.count({ where: { userId } }),
      req.prisma.correctiveAction.count({ where: { userId } }),
      req.prisma.audit.count({ where: { userId } }),
    ]);
    
    const totalRelated = relatedRecords.reduce((a, b) => a + b, 0);
    
    if (totalRelated > 0) {
      return res.status(400).json({ 
        error: `Nie można usunąć użytkownika - ma ${totalRelated} powiązanych rekordów w systemie. Możesz dezaktywować konto zamiast usuwać.` 
      });
    }
    
    await req.prisma.user.delete({
      where: { id: userId },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Nie można usunąć użytkownika - ma powiązane rekordy w systemie' });
    }
    res.status(500).json({ error: 'Błąd usuwania użytkownika' });
  }
});

export default router;

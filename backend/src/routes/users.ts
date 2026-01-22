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
    res.json(users);
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
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkownika' });
  }
});

// POST /api/users
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role = 'EMPLOYEE' } = req.body;
    
    const existingUser = await req.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await req.prisma.user.create({
      data: { email, password: hashedPassword, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia użytkownika' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const updateData: any = { email, name, role };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await req.prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji użytkownika' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania użytkownika' });
  }
});

export default router;

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login i hasło są wymagane' });
    }

    const user = await req.prisma.user.findUnique({
      where: { email: login },
    });

    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        login: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { login, password, name, role = 'EMPLOYEE' } = req.body;

    if (!login || !password || !name) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    const existingUser = await req.prisma.user.findUnique({
      where: { email: login },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym loginie już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await req.prisma.user.create({
      data: {
        email: login,
        password: hashedPassword,
        name,
        role,
      },
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        login: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

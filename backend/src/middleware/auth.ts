import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'haccp-masarnia-secret-key-2024';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  prisma?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacyjnego' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Nieprawidłowy token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Brak uprawnień administratora' });
  }
  next();
};

export const requireManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
    return res.status(403).json({ error: 'Brak uprawnień kierownika' });
  }
  next();
};

export const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
};

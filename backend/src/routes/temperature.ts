import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

// GET /api/temperature/points
router.get('/points', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const points = await req.prisma.temperaturePoint.findMany({
      where: { isActive: true },
      include: { ccp: true },
      orderBy: { name: 'asc' },
    });
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania punktów temperatury' });
  }
});

// POST /api/temperature/points
router.post('/points', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, type, minTemp, maxTemp, ccpId } = req.body;
    const point = await req.prisma.temperaturePoint.create({
      data: { name, location, type, minTemp, maxTemp, ccpId },
    });
    res.status(201).json(point);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia punktu temperatury' });
  }
});

// PUT /api/temperature/points/:id
router.put('/points/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, type, minTemp, maxTemp, ccpId, isActive } = req.body;
    const point = await req.prisma.temperaturePoint.update({
      where: { id: parseInt(req.params.id) },
      data: { name, location, type, minTemp, maxTemp, ccpId, isActive },
    });
    res.json(point);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji punktu temperatury' });
  }
});

// DELETE /api/temperature/points/:id
router.delete('/points/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.temperaturePoint.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania punktu temperatury' });
  }
});

// GET /api/temperature/readings
router.get('/readings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pointId, startDate, endDate, limit = 100 } = req.query;
    
    const where: any = {};
    if (pointId) where.temperaturePointId = parseInt(pointId as string);
    if (startDate) where.readAt = { ...where.readAt, gte: new Date(startDate as string) };
    if (endDate) where.readAt = { ...where.readAt, lte: new Date(endDate as string) };

    const readings = await req.prisma.temperatureReading.findMany({
      where,
      include: {
        temperaturePoint: true,
        user: { select: { name: true } },
      },
      orderBy: { readAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania odczytów temperatury' });
  }
});

// POST /api/temperature/readings
router.post('/readings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { temperaturePointId, temperature, notes } = req.body;
    
    const point = await req.prisma.temperaturePoint.findUnique({
      where: { id: temperaturePointId },
    });
    
    if (!point) {
      return res.status(404).json({ error: 'Punkt temperatury nie znaleziony' });
    }

    const isCompliant = temperature >= point.minTemp && temperature <= point.maxTemp;

    const reading = await req.prisma.temperatureReading.create({
      data: {
        temperaturePointId,
        temperature,
        isCompliant,
        notes,
        userId: req.userId!,
      },
      include: {
        temperaturePoint: true,
        user: { select: { name: true } },
      },
    });

    // Create corrective action if not compliant
    if (!isCompliant) {
      await req.prisma.correctiveAction.create({
        data: {
          title: `Przekroczenie temperatury - ${point.name}`,
          description: `Zmierzona temperatura: ${temperature}°C. Limity: ${point.minTemp}°C - ${point.maxTemp}°C`,
          priority: 'HIGH',
          userId: req.userId!,
        },
      });
    }

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Błąd zapisywania odczytu temperatury' });
  }
});

// GET /api/temperature/trends
router.get('/trends', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pointId, days = 7 } = req.query;
    const startDate = dayjs().subtract(parseInt(days as string), 'day').toDate();

    const where: any = { readAt: { gte: startDate } };
    if (pointId) where.temperaturePointId = parseInt(pointId as string);

    const readings = await req.prisma.temperatureReading.findMany({
      where,
      include: { temperaturePoint: true },
      orderBy: { readAt: 'asc' },
    });

    // Group by point
    const trends: any = {};
    readings.forEach((r: any) => {
      const pointName = r.temperaturePoint.name;
      if (!trends[pointName]) {
        trends[pointName] = {
          pointId: r.temperaturePointId,
          pointName,
          minLimit: r.temperaturePoint.minTemp,
          maxLimit: r.temperaturePoint.maxTemp,
          readings: [],
        };
      }
      trends[pointName].readings.push({
        temperature: r.temperature,
        readAt: r.readAt,
        isCompliant: r.isCompliant,
      });
    });

    res.json(Object.values(trends));
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania trendów temperatury' });
  }
});

export default router;

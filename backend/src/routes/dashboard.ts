import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = dayjs().startOf('day').toDate();
    const weekAgo = dayjs().subtract(7, 'day').toDate();

    const [
      totalProducts,
      activeSuppliers,
      todayReadings,
      nonCompliantReadings,
      pendingActions,
      upcomingAudits,
    ] = await Promise.all([
      req.prisma.product.count({ where: { isActive: true } }),
      req.prisma.supplier.count({ where: { isApproved: true } }),
      req.prisma.temperatureReading.count({
        where: { readAt: { gte: today } },
      }),
      req.prisma.temperatureReading.count({
        where: { readAt: { gte: weekAgo }, isCompliant: false },
      }),
      req.prisma.correctiveAction.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      req.prisma.auditChecklist.count({ where: { isActive: true } }),
    ]);

    res.json({
      totalProducts,
      activeSuppliers,
      todayReadings,
      nonCompliantReadings,
      pendingActions,
      upcomingAudits,
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania statystyk' });
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const alerts: any[] = [];
    const weekAgo = dayjs().subtract(7, 'day').toDate();

    // Non-compliant temperature readings
    const nonCompliantReadings = await req.prisma.temperatureReading.findMany({
      where: { isCompliant: false, readAt: { gte: weekAgo } },
      include: { temperaturePoint: true },
      orderBy: { readAt: 'desc' },
      take: 5,
    });

    nonCompliantReadings.forEach((reading: any) => {
      alerts.push({
        id: `temp-${reading.id}`,
        type: 'TEMPERATURE',
        severity: 'HIGH',
        message: `Przekroczenie temperatury w ${reading.temperaturePoint.name}: ${reading.temperature}°C`,
        createdAt: reading.readAt,
      });
    });

    // Open corrective actions
    const openActions = await req.prisma.correctiveAction.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    openActions.forEach((action: any) => {
      alerts.push({
        id: `action-${action.id}`,
        type: 'CORRECTIVE_ACTION',
        severity: action.priority === 'CRITICAL' ? 'CRITICAL' : action.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        message: `Działanie korygujące: ${action.title}`,
        createdAt: action.createdAt,
      });
    });

    // Sort by date
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(alerts.slice(0, 10));
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania alertów' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const activities: any[] = [];
    const limit = 10;

    // Recent temperature readings
    const readings = await req.prisma.temperatureReading.findMany({
      include: { temperaturePoint: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    readings.forEach((r: any) => {
      activities.push({
        id: `reading-${r.id}`,
        type: 'TEMPERATURE_READING',
        description: `Pomiar temperatury: ${r.temperaturePoint.name} - ${r.temperature}°C`,
        user: r.user.name,
        createdAt: r.createdAt,
      });
    });

    // Recent receptions
    const receptions = await req.prisma.rawMaterialReception.findMany({
      include: { rawMaterial: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    receptions.forEach((r: any) => {
      activities.push({
        id: `reception-${r.id}`,
        type: 'RECEPTION',
        description: `Przyjęcie surowca: ${r.rawMaterial.name} - ${r.quantity} ${r.unit}`,
        user: r.user.name,
        createdAt: r.createdAt,
      });
    });

    // Sort and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(activities.slice(0, limit));
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania aktywności' });
  }
});

// GET /api/dashboard/temperature-chart
router.get('/temperature-chart', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = dayjs().subtract(days, 'day').toDate();

    const readings = await req.prisma.temperatureReading.findMany({
      where: { readAt: { gte: startDate } },
      include: { temperaturePoint: true },
      orderBy: { readAt: 'asc' },
    });

    // Group by point and date
    const chartData: any = {};
    readings.forEach((r: any) => {
      const date = dayjs(r.readAt).format('YYYY-MM-DD');
      const pointName = r.temperaturePoint.name;
      
      if (!chartData[pointName]) {
        chartData[pointName] = {};
      }
      if (!chartData[pointName][date]) {
        chartData[pointName][date] = [];
      }
      chartData[pointName][date].push(r.temperature);
    });

    // Calculate averages
    const result: any = {};
    Object.keys(chartData).forEach((point) => {
      result[point] = Object.keys(chartData[point]).map((date) => ({
        date,
        avgTemp: chartData[point][date].reduce((a: number, b: number) => a + b, 0) / chartData[point][date].length,
      }));
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania danych wykresu' });
  }
});

export default router;

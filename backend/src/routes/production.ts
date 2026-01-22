import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

// GET /api/production/batches
router.get('/batches', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const batches = await req.prisma.productionBatch.findMany({
      where,
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: true,
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            },
          },
        },
      },
      orderBy: { productionDate: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania partii produkcyjnych' });
  }
});

// GET /api/production/batches/:id
router.get('/batches/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.productionBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: { include: { supplier: true } },
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            },
          },
        },
      },
    });
    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania partii' });
  }
});

// GET /api/production/batches/number/:batchNumber
router.get('/batches/number/:batchNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.productionBatch.findUnique({
      where: { batchNumber: req.params.batchNumber },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: { include: { supplier: true } },
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            },
          },
        },
      },
    });
    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania partii' });
  }
});

// POST /api/production/batches
router.post('/batches', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, unit, productionDate, startDateTime, notes, materials } = req.body;

    // Get product for shelf life
    const product = await req.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }

    // Generate batch number
    const date = productionDate ? new Date(productionDate) : new Date();
    const dateStr = dayjs(date).format('YYYYMMDD');
    const count = await req.prisma.productionBatch.count({
      where: {
        productionDate: {
          gte: dayjs(date).startOf('day').toDate(),
          lt: dayjs(date).endOf('day').toDate(),
        },
      },
    });
    const batchNumber = `${dateStr}-${String(count + 1).padStart(3, '0')}`;

    // Calculate expiry date
    const expiryDate = dayjs(date).add(product.shelfLife, 'day').toDate();

    // Użyj podanej daty/godziny lub teraz
    const startTime = startDateTime ? new Date(startDateTime) : new Date();

    const batch = await req.prisma.productionBatch.create({
      data: {
        batchNumber,
        productId,
        quantity,
        unit,
        productionDate: date,
        expiryDate,
        notes,
        userId: req.userId!,
        startTime, // Godzina rozpoczęcia produkcji
        materials: materials ? {
          create: materials.map((m: any) => ({
            rawMaterialId: m.rawMaterialId || null,
            receptionId: m.receptionId || null,
            curingBatchId: m.curingBatchId || null, // Element peklowany
            quantity: m.quantity,
            unit: m.unit,
          })),
        } : undefined,
      },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: { 
          include: { 
            rawMaterial: true, 
            reception: true,
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            }
          } 
        },
      },
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Błąd tworzenia partii produkcyjnej' });
  }
});

// PUT /api/production/batches/:id - Pełna edycja dla admina
router.put('/batches/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      quantity, 
      unit, 
      status, 
      notes,
      productionDate,
      expiryDate,
      startTime,
      endTime,
      finalTemperature,
      temperatureCompliant,
    } = req.body;
    
    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unit !== undefined) updateData.unit = unit;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (productionDate !== undefined) updateData.productionDate = new Date(productionDate);
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (finalTemperature !== undefined) updateData.finalTemperature = finalTemperature;
    if (temperatureCompliant !== undefined) updateData.temperatureCompliant = temperatureCompliant;

    const batch = await req.prisma.productionBatch.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        product: true,
        user: { select: { name: true } },
        materials: { include: { rawMaterial: true, reception: true } },
      },
    });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji partii' });
  }
});

// POST /api/production/batches/:id/complete - Zakończenie produkcji z temperaturą
router.post('/batches/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { finalTemperature, notes, endDateTime } = req.body;
    
    if (finalTemperature === undefined || finalTemperature === null) {
      return res.status(400).json({ error: 'Temperatura końcowa jest wymagana' });
    }

    // Temperatura musi osiągnąć minimum 72°C dla bezpieczeństwa
    const temperatureCompliant = finalTemperature >= 72;

    // Użyj podanej daty/godziny lub teraz
    const endTime = endDateTime ? new Date(endDateTime) : new Date();

    const batch = await req.prisma.productionBatch.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'COMPLETED',
        endTime,
        finalTemperature,
        temperatureCompliant,
        notes: notes || undefined,
      },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: { include: { rawMaterial: true, reception: true } },
      },
    });

    // Jeśli temperatura niezgodna, automatycznie utwórz działanie korygujące
    if (!temperatureCompliant) {
      await req.prisma.correctiveAction.create({
        data: {
          title: `Niezgodna temperatura - partia ${batch.batchNumber}`,
          description: `Partia ${batch.batchNumber} (${batch.product.name}) nie osiągnęła wymaganej temperatury. Zmierzona temperatura: ${finalTemperature}°C (wymagane: ≥72°C)`,
          cause: 'Niewystarczająca obróbka termiczna',
          status: 'OPEN',
          priority: 'HIGH',
          relatedCcpId: 3, // CCP3 - Obróbka termiczna
          userId: req.userId!,
        },
      });
    }

    res.json(batch);
  } catch (error) {
    console.error('Error completing batch:', error);
    res.status(500).json({ error: 'Błąd zakończenia produkcji' });
  }
});

// DELETE /api/production/batches/:id
router.delete('/batches/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Delete materials first
    await req.prisma.batchMaterial.deleteMany({
      where: { batchId: parseInt(req.params.id) },
    });
    await req.prisma.productionBatch.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania partii' });
  }
});

// GET /api/production/traceability/:batchNumber
router.get('/traceability/:batchNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.productionBatch.findUnique({
      where: { batchNumber: req.params.batchNumber },
      include: {
        product: true,
        user: { select: { name: true } },
        materials: {
          include: {
            rawMaterial: true,
            reception: {
              include: {
                supplier: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }

    // Build traceability timeline
    const timeline: any[] = [];

    // Add material receptions
    batch.materials.forEach((mat: any) => {
      if (mat.reception) {
        timeline.push({
          type: 'RECEPTION',
          date: mat.reception.receivedAt,
          title: `Przyjęcie surowca: ${mat.rawMaterial.name}`,
          details: {
            supplier: mat.reception.supplier?.name,
            batch: mat.reception.batchNumber,
            quantity: `${mat.reception.quantity} ${mat.reception.unit}`,
            temperature: mat.reception.temperature,
            document: mat.reception.documentNumber,
          },
        });
      }
    });

    // Add production
    timeline.push({
      type: 'PRODUCTION',
      date: batch.productionDate,
      title: `Produkcja: ${batch.product.name}`,
      details: {
        batchNumber: batch.batchNumber,
        quantity: `${batch.quantity} ${batch.unit}`,
        operator: batch.user.name,
        expiryDate: batch.expiryDate,
      },
    });

    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      batch,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania danych traceability' });
  }
});

export default router;

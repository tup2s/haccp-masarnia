import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/receptions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const receptions = await req.prisma.rawMaterialReception.findMany({
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(receptions);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania przyjęć' });
  }
});

// GET /api/receptions/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const reception = await req.prisma.rawMaterialReception.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
    });
    if (!reception) {
      return res.status(404).json({ error: 'Przyjęcie nie znalezione' });
    }
    res.json(reception);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania przyjęcia' });
  }
});

// POST /api/receptions
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      rawMaterialId, 
      supplierId, 
      batchNumber, 
      quantity, 
      unit, 
      expiryDate, 
      temperature, 
      isCompliant = true, 
      notes, 
      documentNumber,
      receivedDate,
      receivedTime,
      vehicleClean,
      vehicleTemperature,
      packagingIntact,
      documentsComplete
    } = req.body;

    // Utwórz datę przyjęcia łącząc datę i godzinę
    let receivedAt: Date;
    if (receivedDate) {
      if (receivedTime) {
        receivedAt = new Date(`${receivedDate}T${receivedTime}:00`);
      } else {
        receivedAt = new Date(`${receivedDate}T12:00:00`);
      }
    } else {
      receivedAt = new Date();
    }

    const reception = await req.prisma.rawMaterialReception.create({
      data: {
        rawMaterialId,
        supplierId,
        batchNumber,
        quantity,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        temperature,
        isCompliant,
        notes,
        documentNumber,
        receivedAt,
        receivedTime,
        vehicleClean,
        vehicleTemperature,
        packagingIntact,
        documentsComplete,
        userId: req.userId!,
      },
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
    });

    // Create corrective action if not compliant
    if (!isCompliant) {
      await req.prisma.correctiveAction.create({
        data: {
          title: `Niezgodność przy przyjęciu - ${reception.rawMaterial.name}`,
          description: `Partia: ${batchNumber}. ${notes || 'Surowiec niezgodny z wymaganiami'}`,
          priority: 'HIGH',
          userId: req.userId!,
        },
      });
    }

    res.status(201).json(reception);
  } catch (error) {
    res.status(500).json({ error: 'Błąd tworzenia przyjęcia' });
  }
});

// PUT /api/receptions/:id
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      rawMaterialId, 
      supplierId, 
      batchNumber, 
      quantity, 
      unit, 
      expiryDate, 
      temperature, 
      isCompliant, 
      notes, 
      documentNumber,
      receivedDate,
      receivedTime,
      vehicleClean,
      vehicleTemperature,
      packagingIntact,
      documentsComplete
    } = req.body;

    const updateData: any = {
      rawMaterialId,
      supplierId,
      batchNumber,
      quantity,
      unit,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      temperature,
      isCompliant,
      notes,
      documentNumber,
      receivedTime,
      vehicleClean,
      vehicleTemperature,
      packagingIntact,
      documentsComplete,
    };

    // Utwórz receivedAt jeśli podano datę
    if (receivedDate) {
      if (receivedTime) {
        updateData.receivedAt = new Date(`${receivedDate}T${receivedTime}:00`);
      } else {
        updateData.receivedAt = new Date(`${receivedDate}T12:00:00`);
      }
    }

    const reception = await req.prisma.rawMaterialReception.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        rawMaterial: true,
        supplier: true,
        user: { select: { name: true } },
      },
    });
    res.json(reception);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji przyjęcia' });
  }
});

// DELETE /api/receptions/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.rawMaterialReception.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania przyjęcia' });
  }
});

export default router;

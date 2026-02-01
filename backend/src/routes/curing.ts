import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

// GET /api/curing - Lista wszystkich partii peklowania
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = 50 } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const batches = await req.prisma.curingBatch.findMany({
      where,
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { startDate: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(batches);
  } catch (error) {
    console.error('Error fetching curing batches:', error);
    res.status(500).json({ error: 'Błąd pobierania partii peklowania' });
  }
});

// GET /api/curing/completed - Zakończone partie peklowania dostępne dla produkcji
router.get('/completed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batches = await req.prisma.curingBatch.findMany({
      where: { status: 'COMPLETED' },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
        batchMaterials: true, // Sprawdź ile już zużyto
      },
      orderBy: { actualEndDate: 'desc' },
    });
    
    // Oblicz dostępną ilość (ile jeszcze nie zużyto w produkcji)
    const availableBatches = batches.map((batch: typeof batches[0]) => {
      const usedQuantity = batch.batchMaterials.reduce((sum: number, m: { quantity: number }) => sum + m.quantity, 0);
      const availableQuantity = batch.quantity - usedQuantity;
      return {
        ...batch,
        usedQuantity,
        availableQuantity,
        batchMaterials: undefined, // Nie zwracaj szczegółów
      };
    }).filter((batch: { availableQuantity: number }) => batch.availableQuantity > 0); // Tylko te z dostępną ilością
    
    res.json(availableBatches);
  } catch (error) {
    console.error('Error fetching completed curing batches:', error);
    res.status(500).json({ error: 'Błąd pobierania zakończonych partii peklowania' });
  }
});

// GET /api/curing/available/meat - Dostępne mięso do peklowania (PRZED /:id!)
router.get('/available/meat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Pobierz przyjęcia mięsa z ostatnich 14 dni
    const fourteenDaysAgo = dayjs().subtract(14, 'day').toDate();
    
    const receptions = await req.prisma.rawMaterialReception.findMany({
      where: {
        isCompliant: true,
        receivedAt: {
          gte: fourteenDaysAgo,
        },
        rawMaterial: {
          category: 'MEAT',
        },
      },
      include: {
        rawMaterial: true,
        supplier: true,
      },
      orderBy: { receivedAt: 'desc' },
    });
    res.json(receptions);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania dostępnego mięsa' });
  }
});

// GET /api/curing/:id - Szczegóły partii peklowania
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.curingBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
    });
    if (!batch) {
      return res.status(404).json({ error: 'Partia peklowania nie znaleziona' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania partii peklowania' });
  }
});

// POST /api/curing - Nowa partia peklowania
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      receptionId,
      productName, // Nazwa peklowanego produktu
      quantity,
      unit = 'kg',
      curingMethod,
      meatDescription,
      // Peklowanie suche
      curingSaltAmount,
      // Peklowanie nastrzykowe - solanka
      brineWater,
      brineSalt,
      brineMaggi,
      brineSugar,
      plannedDays,
      startDate, // opcjonalna data/godzina rozpoczęcia
      temperature,
      notes,
    } = req.body;

    // Generuj numer partii peklowania w formacie dd-mm
    const date = startDate ? new Date(startDate) : new Date();
    const batchNumber = dayjs(date).format('DD-MM');

    // Sprawdź czy taka partia już istnieje (jeśli tak, dodaj sufiks)
    const existingBatch = await req.prisma.curingBatch.findUnique({
      where: { batchNumber },
    });
    const finalBatchNumber = existingBatch 
      ? `${batchNumber}-${await req.prisma.curingBatch.count() + 1}`
      : batchNumber;

    // Oblicz planowaną datę zakończenia
    const plannedEndDate = dayjs(date).add(plannedDays || 7, 'day').toDate();

    // Znajdź sól peklową w materiałach i odejmij zużycie
    if (curingSaltAmount && parseFloat(curingSaltAmount) > 0) {
      const saltMaterial = await req.prisma.material.findFirst({
        where: { 
          name: { contains: 'sól peklow', mode: 'insensitive' }
        }
      });

      if (saltMaterial) {
        // Oblicz zużycie soli = ilość mięsa * procent soli
        const meatQuantity = parseFloat(quantity);
        const saltPercentage = parseFloat(curingSaltAmount);
        const saltUsed = (meatQuantity * saltPercentage) / 100; // kg soli

        // Znajdź najstarsze dostępne przyjęcie soli peklowej
        const saltReceipt = await req.prisma.materialReceipt.findFirst({
          where: {
            materialId: saltMaterial.id,
            quantity: { gt: saltUsed } // Wystarczająca ilość
          },
          orderBy: { receivedAt: 'asc' } // FIFO - najstarsze pierwsze
        });

        if (saltReceipt) {
          // Odejmij zużycie soli z przyjęcia
          await req.prisma.materialReceipt.update({
            where: { id: saltReceipt.id },
            data: {
              quantity: saltReceipt.quantity - saltUsed
            }
          });
        } else {
          console.warn(`Brak wystarczającej ilości soli peklowej (potrzeba ${saltUsed} kg)`);
          // Kontynuuj bez błędu - może sól jest dodawana innym sposobem
        }
      }
    }

    const batch = await req.prisma.curingBatch.create({
      data: {
        batchNumber: finalBatchNumber,
        receptionId,
        productName,
        quantity,
        unit,
        curingMethod,
        meatDescription,
        curingSaltAmount,
        brineWater,
        brineSalt,
        brineMaggi,
        brineSugar,
        startDate: date,
        plannedEndDate,
        temperature,
        notes,
        userId: req.userId!,
      },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
    });

    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating curing batch:', error);
    res.status(500).json({ error: 'Błąd tworzenia partii peklowania' });
  }
});

// PUT /api/curing/:id - Aktualizacja partii peklowania (admin)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      productName,
      quantity,
      curingMethod,
      meatDescription,
      curingSaltAmount,
      brineWater,
      brineSalt,
      brineMaggi,
      brineSugar,
      startDate,
      plannedEndDate,
      actualEndDate,
      temperature,
      notes,
      status,
    } = req.body;

    const updateData: any = {};
    if (productName !== undefined) updateData.productName = productName;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (curingMethod !== undefined) updateData.curingMethod = curingMethod;
    if (meatDescription !== undefined) updateData.meatDescription = meatDescription;
    if (curingSaltAmount !== undefined) updateData.curingSaltAmount = curingSaltAmount;
    if (brineWater !== undefined) updateData.brineWater = brineWater;
    if (brineSalt !== undefined) updateData.brineSalt = brineSalt;
    if (brineMaggi !== undefined) updateData.brineMaggi = brineMaggi;
    if (brineSugar !== undefined) updateData.brineSugar = brineSugar;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (plannedEndDate !== undefined) updateData.plannedEndDate = new Date(plannedEndDate);
    if (actualEndDate !== undefined) updateData.actualEndDate = new Date(actualEndDate);
    if (temperature !== undefined) updateData.temperature = temperature;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const batch = await req.prisma.curingBatch.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
    });
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji partii peklowania' });
  }
});

// POST /api/curing/:id/complete - Zakończenie peklowania
router.post('/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { notes, endDate } = req.body;

    const batch = await req.prisma.curingBatch.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'COMPLETED',
        actualEndDate: endDate ? new Date(endDate) : new Date(),
        notes: notes || undefined,
      },
      include: {
        reception: {
          include: {
            rawMaterial: true,
            supplier: true,
          },
        },
        user: { select: { name: true } },
      },
    });

    res.json(batch);
  } catch (error) {
    console.error('Error completing curing batch:', error);
    res.status(500).json({ error: 'Błąd zakończenia peklowania' });
  }
});

// DELETE /api/curing/:id - Usunięcie partii peklowania
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await req.prisma.curingBatch.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania partii peklowania' });
  }
});

export default router;

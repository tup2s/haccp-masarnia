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
            material: true,
            materialReceipt: {
              include: { material: true, supplier: true }
            }
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
            material: true,
            materialReceipt: {
              include: { material: true, supplier: true }
            }
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
    const batch = await req.prisma.productionBatch.findFirst({
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
    const { productId, quantity, unit, productionDate, startDateTime, notes, materials, userId: selectedUserId } = req.body;

    // Admin może wybrać innego operatora
    const effectiveUserId = (req.userRole === 'ADMIN' && selectedUserId) ? selectedUserId : req.userId!;

    // Get product for shelf life
    const product = await req.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }

    // Generate batch number - format YYYYMMDD (jedna partia dziennie na produkt)
    // Jeśli ten sam produkt produkowany tego dnia więcej razy, dodaj sufiks -2, -3 itd.
    const date = productionDate ? new Date(productionDate) : new Date();
    const dateStr = dayjs(date).format('YYYYMMDD');
    
    // Sprawdź ile partii TEGO PRODUKTU jest już tego dnia
    const countSameProduct = await req.prisma.productionBatch.count({
      where: {
        productId,
        productionDate: {
          gte: dayjs(date).startOf('day').toDate(),
          lt: dayjs(date).endOf('day').toDate(),
        },
      },
    });
    
    // Pierwsza partia danego produktu w dniu = sama data, kolejne = data + sufiks
    const batchNumber = countSameProduct === 0 
      ? dateStr 
      : `${dateStr}-${countSameProduct + 1}`;

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
        userId: effectiveUserId,
        startTime, // Godzina rozpoczęcia produkcji
        materials: materials ? {
          create: materials.map((m: any) => ({
            rawMaterialId: m.rawMaterialId || null,
            receptionId: m.receptionId || null,
            curingBatchId: m.curingBatchId || null, // Element peklowany
            materialId: m.materialId || null, // Materiał/dodatek
            materialReceiptId: m.materialReceiptId || null, // Przyjęcie materiału
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
            },
            material: true,
            materialReceipt: {
              include: { material: true, supplier: true }
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
        materials: { 
          include: { 
            rawMaterial: true, 
            reception: true,
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            },
            material: true,
            materialReceipt: {
              include: { material: true, supplier: true }
            }
          } 
        },
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

    // Pobierz partię z produktem żeby sprawdzić wymaganą temperaturę
    const batch = await req.prisma.productionBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { product: true }
    });

    if (!batch) {
      return res.status(404).json({ error: 'Partia nie znaleziona' });
    }

    // Użyj temperatury z produktu lub domyślnej 72°C
    const requiredTemperature = batch.product.requiredTemperature || 72;
    const temperatureCompliant = finalTemperature >= requiredTemperature;

    // Użyj podanej daty/godziny lub teraz
    const endTime = endDateTime ? new Date(endDateTime) : new Date();

    const updatedBatch = await req.prisma.productionBatch.update({
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
        materials: { 
          include: { 
            rawMaterial: true, 
            reception: true,
            curingBatch: {
              include: {
                reception: { include: { rawMaterial: true } }
              }
            },
            material: true,
            materialReceipt: {
              include: { material: true, supplier: true }
            }
          } 
        },
      },
    });

    // Jeśli temperatura niezgodna, automatycznie utwórz działanie korygujące
    if (!temperatureCompliant) {
      await req.prisma.correctiveAction.create({
        data: {
          title: `Niezgodna temperatura - partia ${updatedBatch.batchNumber}`,
          description: `Partia ${updatedBatch.batchNumber} (${updatedBatch.product.name}) nie osiągnęła wymaganej temperatury. Zmierzona temperatura: ${finalTemperature}°C (wymagane: ≥${requiredTemperature}°C)`,
          cause: 'Niewystarczająca obróbka termiczna',
          status: 'OPEN',
          priority: 'HIGH',
          relatedCcpId: 3, // CCP3 - Obróbka termiczna
          userId: req.userId!,
        },
      });
    }

    res.json(updatedBatch);
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

// GET /api/production/traceability/:id
router.get('/traceability/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const batch = await req.prisma.productionBatch.findUnique({
      where: { id: parseInt(req.params.id) },
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
            curingBatch: {
              include: {
                reception: {
                  include: {
                    rawMaterial: true,
                    supplier: true,
                  },
                },
                user: { select: { name: true } },
              },
            },
            material: true,
            materialReceipt: {
              include: {
                material: true,
                supplier: true,
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

    // Add material receptions (surowce)
    batch.materials.forEach((mat: any) => {
      if (mat.reception) {
        timeline.push({
          type: 'RECEPTION',
          date: mat.reception.receivedAt,
          title: `Przyjęcie surowca: ${mat.rawMaterial?.name || 'Nieznany'}`,
          details: {
            Dostawca: mat.reception.supplier?.name || 'N/A',
            'Nr partii': mat.reception.batchNumber,
            Ilość: `${mat.reception.quantity} ${mat.reception.unit}`,
            Temperatura: mat.reception.temperature ? `${mat.reception.temperature}°C` : 'N/A',
            Dokument: mat.reception.documentNumber || 'N/A',
          },
        });
      }
      
      // Add curing batches (partie peklowane)
      if (mat.curingBatch) {
        const curingBatch = mat.curingBatch;
        timeline.push({
          type: 'CURING',
          date: curingBatch.startDate,
          title: `Peklowanie: ${curingBatch.productName || curingBatch.meatDescription || 'Produkt peklowany'}`,
          details: {
            'Nr partii pekl.': curingBatch.batchNumber,
            'Surowiec': curingBatch.reception?.rawMaterial?.name || 'N/A',
            'Dostawca surowca': curingBatch.reception?.supplier?.name || 'N/A',
            Ilość: `${curingBatch.quantity} ${curingBatch.unit}`,
            Metoda: curingBatch.curingMethod === 'DRY' ? 'Suche' : curingBatch.curingMethod === 'INJECTION' ? 'Nastrzykowe' : curingBatch.curingMethod,
            'Data start': dayjs(curingBatch.startDate).format('DD.MM.YYYY'),
            'Data koniec': curingBatch.actualEndDate ? dayjs(curingBatch.actualEndDate).format('DD.MM.YYYY') : 'W trakcie',
            Status: curingBatch.status === 'COMPLETED' ? 'Zakończone' : curingBatch.status === 'IN_PROGRESS' ? 'W trakcie' : curingBatch.status,
          },
        });
        
        // Also add original reception for the cured meat
        if (curingBatch.reception) {
          timeline.push({
            type: 'RECEPTION',
            date: curingBatch.reception.receivedAt,
            title: `Przyjęcie na zakład: ${curingBatch.reception.rawMaterial?.name || 'Surowiec'}`,
            details: {
              Dostawca: curingBatch.reception.supplier?.name || 'N/A',
              'Nr partii': curingBatch.reception.batchNumber,
              Ilość: `${curingBatch.reception.quantity} ${curingBatch.reception.unit}`,
            },
          });
        }
      }
      
      // Add materials/additives (materiały/dodatki)
      if (mat.materialReceipt) {
        timeline.push({
          type: 'MATERIAL',
          date: mat.materialReceipt.receivedAt,
          title: `Materiał/dodatek: ${mat.material?.name || mat.materialReceipt.material?.name || 'Nieznany'}`,
          details: {
            'Nr partii': mat.materialReceipt.batchNumber,
            Dostawca: mat.materialReceipt.supplier?.name || 'N/A',
            'Użyta ilość': `${mat.quantity} ${mat.unit}`,
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
        'Nr partii': batch.batchNumber,
        Ilość: `${batch.quantity} ${batch.unit}`,
        Operator: batch.user.name,
        'Data ważności': dayjs(batch.expiryDate).format('DD.MM.YYYY'),
        Status: batch.status,
      },
    });

    // Sort by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      batch,
      timeline,
    });
  } catch (error) {
    console.error('Traceability error:', error);
    res.status(500).json({ error: 'Błąd pobierania danych traceability' });
  }
});

// GET /api/production/available-materials - Materiały dostępne do użycia
router.get('/available-materials', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const materials = await req.prisma.materialReceipt.findMany({
      where: {
        expiryDate: {
          gte: new Date() // Tylko nie przeterminowane
        }
      },
      include: {
        material: true,
        supplier: true
      },
      orderBy: [
        { material: { name: 'asc' } },
        { receivedAt: 'desc' }
      ]
    });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching available materials:', error);
    res.status(500).json({ error: 'Błąd pobierania dostępnych materiałów' });
  }
});

export default router;

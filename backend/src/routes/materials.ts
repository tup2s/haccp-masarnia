import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/materials - lista materiałów
router.get('/', authenticateToken, async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(materials);
  } catch (error) {
    console.error('Błąd pobierania materiałów:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ========================================
// PRZYJĘCIA MATERIAŁÓW (PRZED /:id!)
// ========================================

// GET /api/materials/receipts/all - lista przyjęć
router.get('/receipts/all', authenticateToken, async (req, res) => {
  try {
    const receipts = await prisma.materialReceipt.findMany({
      include: {
        material: true,
        supplier: true,
      },
      orderBy: { receivedAt: 'desc' },
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/materials/receipts - przyjęcie materiału
router.post('/receipts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { materialId, supplierId, batchNumber, quantity, unit, expiryDate, pricePerUnit, documentNumber, notes } = req.body;

    // Utwórz przyjęcie
    const receipt = await prisma.materialReceipt.create({
      data: {
        materialId,
        supplierId: supplierId || null,
        batchNumber,
        quantity,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        pricePerUnit: pricePerUnit || null,
        documentNumber: documentNumber || null,
        notes: notes || null,
      },
      include: {
        material: true,
        supplier: true,
      },
    });

    // Zaktualizuj stan magazynowy
    await prisma.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          increment: quantity,
        },
      },
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.error('Błąd przyjęcia materiału:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PUT /api/materials/receipts/:id - edycja przyjęcia
router.put('/receipts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { batchNumber, quantity, unit, expiryDate, pricePerUnit, documentNumber, notes } = req.body;
    const receiptId = parseInt(req.params.id);

    // Pobierz obecne przyjęcie żeby zaktualizować stan magazynowy
    const currentReceipt = await prisma.materialReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!currentReceipt) {
      return res.status(404).json({ error: 'Przyjęcie nie znalezione' });
    }

    // Oblicz różnicę w ilości
    const quantityDiff = quantity - currentReceipt.quantity;

    // Zaktualizuj przyjęcie
    const receipt = await prisma.materialReceipt.update({
      where: { id: receiptId },
      data: {
        batchNumber,
        quantity,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        pricePerUnit: pricePerUnit || null,
        documentNumber: documentNumber || null,
        notes: notes || null,
      },
      include: {
        material: true,
        supplier: true,
      },
    });

    // Zaktualizuj stan magazynowy o różnicę
    if (quantityDiff !== 0) {
      await prisma.material.update({
        where: { id: currentReceipt.materialId },
        data: {
          currentStock: {
            increment: quantityDiff,
          },
        },
      });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Błąd edycji przyjęcia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/materials/receipts/:id - usunięcie przyjęcia
router.delete('/receipts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const receiptId = parseInt(req.params.id);

    // Pobierz przyjęcie żeby odjąć od stanu magazynowego
    const receipt = await prisma.materialReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Przyjęcie nie znalezione' });
    }

    // Usuń przyjęcie
    await prisma.materialReceipt.delete({
      where: { id: receiptId },
    });

    // Odejmij ilość od stanu magazynowego
    await prisma.material.update({
      where: { id: receipt.materialId },
      data: {
        currentStock: {
          decrement: receipt.quantity,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Błąd usuwania przyjęcia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/materials/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        supplier: true,
        receipts: {
          orderBy: { receivedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!material) {
      return res.status(404).json({ error: 'Materiał nie znaleziony' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/materials - dodaj materiał
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, unit, supplierId, minStock, storageConditions, allergens } = req.body;

    const material = await prisma.material.create({
      data: {
        name,
        category,
        unit,
        supplierId: supplierId || null,
        minStock: minStock || null,
        storageConditions: storageConditions || null,
        allergens: allergens || null,
      },
      include: { supplier: true },
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Błąd tworzenia materiału:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PUT /api/materials/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, unit, supplierId, minStock, currentStock, storageConditions, allergens, isActive } = req.body;

    const material = await prisma.material.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        category,
        unit,
        supplierId: supplierId || null,
        minStock: minStock || null,
        currentStock: currentStock || 0,
        storageConditions: storageConditions || null,
        allergens: allergens || null,
        isActive: isActive ?? true,
      },
      include: { supplier: true },
    });

    res.json(material);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.material.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

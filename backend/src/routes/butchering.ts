import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/butchering - lista rozbiorów
router.get('/', authenticateToken, async (req, res) => {
  try {
    const butcherings = await prisma.butchering.findMany({
      include: {
        elements: true,
      },
      orderBy: { butcheringDate: 'desc' },
    });
    res.json(butcherings);
  } catch (error) {
    console.error('Błąd pobierania rozbiorów:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/butchering/elements/available - dostępne elementy z rozbiorów do produkcji (PRZED /:id!)
router.get('/elements/available', authenticateToken, async (req, res) => {
  try {
    const butcherings = await prisma.butchering.findMany({
      include: {
        elements: true,
      },
      orderBy: { butcheringDate: 'desc' },
    });

    // Przygotuj listę elementów z informacją o partii
    const availableElements = butcherings.flatMap(b => 
      b.elements.map(el => ({
        id: el.id,
        butcheringId: b.id,
        batchNumber: b.batchNumber,
        butcheringDate: b.butcheringDate,
        elementName: el.elementName,
        quantity: el.quantity,
        destination: el.destination,
      }))
    );

    res.json(availableElements);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/butchering/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const butchering = await prisma.butchering.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        elements: true,
      },
    });
    if (!butchering) {
      return res.status(404).json({ error: 'Rozbior nie znaleziony' });
    }
    res.json(butchering);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/butchering - utwórz rozbior
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { receptionId, batchNumber, butcheringDate, notes, elements } = req.body;

    const butchering = await prisma.butchering.create({
      data: {
        receptionId,
        batchNumber,
        butcheringDate: butcheringDate ? new Date(butcheringDate) : new Date(),
        notes: notes || null,
        elements: {
          create: elements.map((el: any) => ({
            elementName: el.elementName,
            quantity: el.quantity,
            destination: el.destination || null,
            notes: el.notes || null,
          })),
        },
      },
      include: {
        elements: true,
      },
    });

    res.status(201).json(butchering);
  } catch (error) {
    console.error('Błąd tworzenia rozbioru:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PUT /api/butchering/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { butcheringDate, notes, elements } = req.body;
    const id = parseInt(req.params.id);

    // Usuń stare elementy i dodaj nowe
    await prisma.butcheringElement.deleteMany({
      where: { butcheringId: id },
    });

    const butchering = await prisma.butchering.update({
      where: { id },
      data: {
        butcheringDate: butcheringDate ? new Date(butcheringDate) : undefined,
        notes: notes || null,
        elements: {
          create: elements.map((el: any) => ({
            elementName: el.elementName,
            quantity: el.quantity,
            destination: el.destination || null,
            notes: el.notes || null,
          })),
        },
      },
      include: {
        elements: true,
      },
    });

    res.json(butchering);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// DELETE /api/butchering/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.butchering.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

export default router;

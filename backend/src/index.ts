import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import dashboardRoutes from './routes/dashboard';
import temperatureRoutes from './routes/temperature';
import suppliersRoutes from './routes/suppliers';
import rawMaterialsRoutes from './routes/rawMaterials';
import receptionsRoutes from './routes/receptions';
import productsRoutes from './routes/products';
import productionRoutes from './routes/production';
import cleaningRoutes from './routes/cleaning';
import pestControlRoutes from './routes/pestControl';
import trainingsRoutes from './routes/trainings';
import correctiveActionsRoutes from './routes/correctiveActions';
import auditsRoutes from './routes/audits';
import documentsRoutes from './routes/documents';
import haccpPlanRoutes from './routes/haccpPlan';
import reportsRoutes from './routes/reports';
import curingRoutes from './routes/curing';
import settingsRoutes from './routes/settings';
import materialsRoutes from './routes/materials';
import butcheringRoutes from './routes/butchering';
import labelsRoutes from './routes/labels';
import documentReportsRoutes from './routes/documentReports';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serwuj pliki statyczne dokumentów HACCP
app.use('/haccp-docs', express.static(path.join(__dirname, '../document-templates')));

// Attach prisma to request
app.use((req: any, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/temperature', temperatureRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/raw-materials', rawMaterialsRoutes);
app.use('/api/receptions', receptionsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/cleaning', cleaningRoutes);
app.use('/api/pest-control', pestControlRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/corrective-actions', correctiveActionsRoutes);
app.use('/api/audits', auditsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/haccp-plan', haccpPlanRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/curing', curingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/butchering', butcheringRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/document-reports', documentReportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Wystąpił błąd serwera' });
});

// Start server - nasłuchuj na wszystkich interfejsach
const HOST = process.env.HOST || '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Serwer HACCP uruchomiony na ${HOST}:${PORT}`);
  console.log(`📊 API dostępne pod adresem: http://localhost:${PORT}/api`);
  console.log(`🌐 Dostępne w sieci lokalnej na porcie ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// API URL - w produkcji używaj zmiennej środowiskowej VITE_API_URL
// VITE_API_URL powinien być bez /api na końcu (np. https://haccp-masarnia.onrender.com)

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    // Produkcja - dodaj /api do URL
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/$/, ''); // usuń trailing slash
    return `${baseUrl}/api`;
  }
  // Lokalnie (development)
  if (window.location.hostname === 'localhost') {
    return '/api';  // Używaj proxy Vite
  }
  return `http://${window.location.hostname}:3001/api`;  // Z sieci używaj bezpośrednio backendu
};

const API_URL = getApiUrl();

let authToken: string | null = null;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Błąd serwera' }));
    throw new Error(error.error || 'Błąd serwera');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

async function requestBlob(endpoint: string): Promise<Blob> {
  const headers: HeadersInit = {};
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!response.ok) {
    throw new Error('Błąd pobierania pliku');
  }
  return response.blob();
}

export interface User {
  id: number;
  login: string;
  name: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TemperaturePoint {
  id: number;
  name: string;
  location: string;
  type: string;
  minTemp: number;
  maxTemp: number;
  ccpId?: number;
  isActive: boolean;
}

export interface TemperatureReading {
  id: number;
  temperaturePointId: number;
  temperature: number;
  isCompliant: boolean;
  notes?: string;
  readAt: string;
  userId: number;
  temperaturePoint?: TemperaturePoint;
  user?: { name: string };
}

export interface Supplier {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  vetNumber?: string;
  contactPerson?: string;
  isApproved: boolean;
  notes?: string;
}

export interface RawMaterial {
  id: number;
  name: string;
  category: string;
  unit: string;
  supplierId?: number;
  storageConditions?: string;
  shelfLife?: number;
  allergens?: string;
  supplier?: Supplier;
}

export interface RawMaterialReception {
  id: number;
  rawMaterialId: number;
  supplierId: number;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  temperature?: number;
  isCompliant: boolean;
  notes?: string;
  documentNumber?: string;
  receivedAt: string;
  rawMaterial?: RawMaterial;
  supplier?: Supplier;
  user?: { name: string };
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  unit: string;
  shelfLife: number;
  storageTemp: string;
  allergens?: string;
  requiredTemperature?: number; // Wymagana temperatura wewnętrzna w °C
  isActive: boolean;
}

export interface ProductionBatch {
  id: number;
  batchNumber: string;
  productId: number;
  quantity: number;
  unit: string;
  productionDate: string;
  expiryDate: string;
  status: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  finalTemperature?: number;
  temperatureCompliant?: boolean;
  product?: Product;
  user?: { name: string };
  materials?: BatchMaterial[];
}

export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  supplierId?: number;
  minStock?: number;
  currentStock: number;
  storageConditions?: string;
  allergens?: string;
  isActive: boolean;
  supplier?: Supplier;
}

export interface MaterialReceipt {
  id: number;
  materialId: number;
  supplierId?: number;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  pricePerUnit?: number;
  documentNumber?: string;
  receivedAt: string;
  notes?: string;
  material: Material;
  supplier?: Supplier;
}

export interface BatchMaterial {
  id: number;
  batchId: number;
  rawMaterialId?: number;
  receptionId?: number;
  curingBatchId?: number;
  materialId?: number;
  materialReceiptId?: number;
  quantity: number;
  unit: string;
  rawMaterial?: RawMaterial;
  reception?: RawMaterialReception;
  curingBatch?: CuringBatch;
  material?: Material;
  materialReceipt?: MaterialReceipt;
}

export interface CuringBatch {
  id: number;
  batchNumber: string;
  receptionId: number;
  productName?: string; // Nazwa peklowanego produktu (opcjonalne dla starych rekordów)
  quantity: number;
  unit: string;
  curingMethod: string;
  meatDescription?: string; // Dodatkowy opis: tłusta II, chuda II, mięso kl I
  // Peklowanie suche
  curingSaltAmount?: number;
  // Peklowanie nastrzykowe - solanka
  brineWater?: number;
  brineSalt?: number;
  brineMaggi?: number;
  brineSugar?: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  temperature?: number;
  status: string;
  notes?: string;
  reception?: RawMaterialReception;
  user?: { name: string };
}

export interface CleaningArea {
  id: number;
  name: string;
  location: string;
  frequency: string;
  method: string;
  chemicals?: string;
  isActive: boolean;
}

export interface CleaningRecord {
  id: number;
  cleaningAreaId: number;
  cleanedAt: string;
  method: string;
  chemicals?: string;
  isVerified: boolean;
  notes?: string;
  cleaningArea?: CleaningArea;
  user?: { name: string };
}

export interface PestControlPoint {
  id: number;
  name: string;
  location: string;
  type: string;
  isActive: boolean;
}

export interface PestControlCheck {
  id: number;
  pestControlPointId: number;
  checkedAt: string;
  status: string;
  findings?: string;
  actionTaken?: string;
  pestControlPoint?: PestControlPoint;
  user?: { name: string };
}

export interface TrainingRecord {
  id: number;
  title: string;
  type: string;
  description?: string;
  trainer: string;
  trainingDate: string;
  validUntil?: string;
  participants?: TrainingParticipant[];
}

export interface TrainingParticipant {
  id: number;
  trainingId: number;
  userId: number;
  passed: boolean;
  notes?: string;
  user?: { id: number; name: string };
}

export interface CorrectiveAction {
  id: number;
  title: string;
  description: string;
  cause?: string;
  actionTaken?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  relatedCcpId?: number;
  user?: { name: string };
  createdAt: string;
}

export interface AuditChecklist {
  id: number;
  name: string;
  category: string;
  items: { id: number; question: string; category: string }[];
  isActive: boolean;
}

export interface AuditRecord {
  id: number;
  checklistId: number;
  auditDate: string;
  auditor: string;
  results: any;
  score?: number;
  findings?: string;
  recommendations?: string;
  checklist?: AuditChecklist;
  user?: { name: string };
}

export interface Document {
  id: number;
  title: string;
  category: string;
  fileName: string;
  filePath: string;
  version: string;
  validFrom: string;
  validUntil?: string;
  user?: { name: string };
}

export interface CCP {
  id: number;
  name: string;
  description: string;
  hazardType: string;
  criticalLimit: string;
  monitoringMethod: string;
  monitoringFrequency: string;
  correctiveAction: string;
  verificationMethod: string;
  recordKeeping: string;
  isActive: boolean;
}

export interface Hazard {
  id: number;
  name: string;
  type: string;
  source: string;
  preventiveMeasure: string;
  significance: string;
  processStep: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeSuppliers: number;
  todayReadings: number;
  nonCompliantReadings: number;
  pendingActions: number;
  upcomingAudits: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export const api = {
  setToken: (token: string | null) => {
    authToken = token;
  },

  // Auth
  login: (login: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  register: (data: { login: string; password: string; name: string; role?: string }) =>
    request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users
  getUsers: () => request<User[]>('/users'),
  getUser: (id: number) => request<User>(`/users/${id}`),
  createUser: (data: Partial<User> & { password: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
  getDashboardAlerts: () => request<Alert[]>('/dashboard/alerts'),
  getDashboardActivity: () => request<any[]>('/dashboard/recent-activity'),
  getDashboardChart: (days?: number) =>
    request<any>(`/dashboard/temperature-chart${days ? `?days=${days}` : ''}`),

  // Temperature
  getTemperaturePoints: () => request<TemperaturePoint[]>('/temperature/points'),
  createTemperaturePoint: (data: Partial<TemperaturePoint>) =>
    request<TemperaturePoint>('/temperature/points', { method: 'POST', body: JSON.stringify(data) }),
  updateTemperaturePoint: (id: number, data: Partial<TemperaturePoint>) =>
    request<TemperaturePoint>(`/temperature/points/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemperaturePoint: (id: number) =>
    request<void>(`/temperature/points/${id}`, { method: 'DELETE' }),
  getTemperatureReadings: (params?: { pointId?: number; startDate?: string; endDate?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.pointId) query.append('pointId', params.pointId.toString());
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<TemperatureReading[]>(`/temperature/readings?${query}`);
  },
  createTemperatureReading: (data: { temperaturePointId: number; temperature: number; notes?: string; userId?: number; readAt?: string }) =>
    request<TemperatureReading>('/temperature/readings', { method: 'POST', body: JSON.stringify(data) }),
  getTemperatureTrends: (params?: { pointId?: number; days?: number }) => {
    const query = new URLSearchParams();
    if (params?.pointId) query.append('pointId', params.pointId.toString());
    if (params?.days) query.append('days', params.days.toString());
    return request<any[]>(`/temperature/trends?${query}`);
  },

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  getSupplier: (id: number) => request<Supplier>(`/suppliers/${id}`),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: Partial<Supplier>) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  // Raw Materials
  getRawMaterials: () => request<RawMaterial[]>('/raw-materials'),
  getRawMaterial: (id: number) => request<RawMaterial>(`/raw-materials/${id}`),
  createRawMaterial: (data: Partial<RawMaterial>) =>
    request<RawMaterial>('/raw-materials', { method: 'POST', body: JSON.stringify(data) }),
  updateRawMaterial: (id: number, data: Partial<RawMaterial>) =>
    request<RawMaterial>(`/raw-materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRawMaterial: (id: number) => request<void>(`/raw-materials/${id}`, { method: 'DELETE' }),

  // Receptions
  getReceptions: (limit?: number) => request<RawMaterialReception[]>(`/receptions${limit ? `?limit=${limit}` : ''}`),
  getReception: (id: number) => request<RawMaterialReception>(`/receptions/${id}`),
  createReception: (data: Partial<RawMaterialReception>) =>
    request<RawMaterialReception>('/receptions', { method: 'POST', body: JSON.stringify(data) }),
  updateReception: (id: number, data: Partial<RawMaterialReception>) =>
    request<RawMaterialReception>(`/receptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReception: (id: number) => request<void>(`/receptions/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: () => request<Product[]>('/products'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  // Production
  getProductionBatches: (params?: { limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    return request<ProductionBatch[]>(`/production/batches?${query}`);
  },
  getProductionBatch: (id: number) => request<ProductionBatch>(`/production/batches/${id}`),
  getProductionBatchByNumber: (batchNumber: string) =>
    request<ProductionBatch>(`/production/batches/number/${batchNumber}`),
  createProductionBatch: (data: { productId: number; quantity: number; unit: string; productionDate?: string; startDateTime?: string; notes?: string; materials?: any[] }) =>
    request<ProductionBatch>('/production/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateProductionBatch: (id: number, data: any) =>
    request<ProductionBatch>(`/production/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProductionBatch: (id: number) => request<void>(`/production/batches/${id}`, { method: 'DELETE' }),
  completeProductionBatch: (id: number, data: { finalTemperature: number; notes?: string; endDateTime?: string }) =>
    request<ProductionBatch>(`/production/batches/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  getTraceability: (batchId: number) => request<{ batch: ProductionBatch; timeline: any[] }>(`/production/traceability/${batchId}`),
  getAvailableMaterials: () => request<MaterialReceipt[]>(`/production/available-materials`),

  // Curing (Peklowanie)
  getCuringBatches: (params?: { status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<CuringBatch[]>(`/curing?${query}`);
  },
  getCuringBatch: (id: number) => request<CuringBatch>(`/curing/${id}`),
  createCuringBatch: (data: {
    receptionId: number;
    quantity: number;
    unit?: string;
    curingMethod: string;
    curingSaltAmount?: number;
    brineWater?: number;
    brineSalt?: number;
    brineMaggi?: number;
    brineSugar?: number;
    plannedDays: number;
    startDate?: string;
    temperature?: number;
    notes?: string;
  }) => request<CuringBatch>('/curing', { method: 'POST', body: JSON.stringify(data) }),
  updateCuringBatch: (id: number, data: Partial<CuringBatch>) =>
    request<CuringBatch>(`/curing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  completeCuringBatch: (id: number, notes?: string, endDate?: string) =>
    request<CuringBatch>(`/curing/${id}/complete`, { method: 'POST', body: JSON.stringify({ notes, endDate }) }),
  deleteCuringBatch: (id: number) => request<void>(`/curing/${id}`, { method: 'DELETE' }),
  getAvailableMeatForCuring: () => request<RawMaterialReception[]>('/curing/available/meat'),
  getCompletedCuringBatches: () => request<(CuringBatch & { availableQuantity: number })[]>('/curing/completed'),

  // Cleaning
  getCleaningAreas: () => request<CleaningArea[]>('/cleaning/areas'),
  createCleaningArea: (data: Partial<CleaningArea>) =>
    request<CleaningArea>('/cleaning/areas', { method: 'POST', body: JSON.stringify(data) }),
  updateCleaningArea: (id: number, data: Partial<CleaningArea>) =>
    request<CleaningArea>(`/cleaning/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCleaningArea: (id: number) => request<void>(`/cleaning/areas/${id}`, { method: 'DELETE' }),
  getCleaningRecords: (areaId?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (areaId) query.append('areaId', areaId.toString());
    if (limit) query.append('limit', limit.toString());
    return request<CleaningRecord[]>(`/cleaning/records?${query}`);
  },
  createCleaningRecord: (data: { cleaningAreaId: number; method: string; chemicals?: string; isVerified?: boolean; notes?: string; userId?: number; cleanedAt?: string }) =>
    request<CleaningRecord>('/cleaning/records', { method: 'POST', body: JSON.stringify(data) }),

  // Pest Control
  getPestControlPoints: () => request<PestControlPoint[]>('/pest-control/points'),
  createPestControlPoint: (data: Partial<PestControlPoint>) =>
    request<PestControlPoint>('/pest-control/points', { method: 'POST', body: JSON.stringify(data) }),
  updatePestControlPoint: (id: number, data: Partial<PestControlPoint>) =>
    request<PestControlPoint>(`/pest-control/points/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePestControlPoint: (id: number) => request<void>(`/pest-control/points/${id}`, { method: 'DELETE' }),
  getPestControlChecks: (pointId?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (pointId) query.append('pointId', pointId.toString());
    if (limit) query.append('limit', limit.toString());
    return request<PestControlCheck[]>(`/pest-control/checks?${query}`);
  },
  createPestControlCheck: (data: { pestControlPointId: number; status: string; findings?: string; actionTaken?: string }) =>
    request<PestControlCheck>('/pest-control/checks', { method: 'POST', body: JSON.stringify(data) }),

  // Trainings
  getTrainings: () => request<TrainingRecord[]>('/trainings'),
  getTraining: (id: number) => request<TrainingRecord>(`/trainings/${id}`),
  createTraining: (data: { title: string; type: string; description?: string; trainer: string; trainingDate: string; validUntil?: string; participantIds?: number[] }) =>
    request<TrainingRecord>('/trainings', { method: 'POST', body: JSON.stringify(data) }),
  updateTraining: (id: number, data: Partial<TrainingRecord>) =>
    request<TrainingRecord>(`/trainings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTraining: (id: number) => request<void>(`/trainings/${id}`, { method: 'DELETE' }),

  // Corrective Actions
  getCorrectiveActions: (params?: { status?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    return request<CorrectiveAction[]>(`/corrective-actions?${query}`);
  },
  getCorrectiveAction: (id: number) => request<CorrectiveAction>(`/corrective-actions/${id}`),
  createCorrectiveAction: (data: Partial<CorrectiveAction>) =>
    request<CorrectiveAction>('/corrective-actions', { method: 'POST', body: JSON.stringify(data) }),
  updateCorrectiveAction: (id: number, data: Partial<CorrectiveAction>) =>
    request<CorrectiveAction>(`/corrective-actions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCorrectiveAction: (id: number) => request<void>(`/corrective-actions/${id}`, { method: 'DELETE' }),

  // Audits
  getAuditChecklists: () => request<AuditChecklist[]>('/audits/checklists'),
  createAuditChecklist: (data: { name: string; category: string; items: any[] }) =>
    request<AuditChecklist>('/audits/checklists', { method: 'POST', body: JSON.stringify(data) }),
  updateAuditChecklist: (id: number, data: Partial<AuditChecklist>) =>
    request<AuditChecklist>(`/audits/checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAuditChecklist: (id: number) => request<void>(`/audits/checklists/${id}`, { method: 'DELETE' }),
  getAuditRecords: (checklistId?: number, limit?: number) => {
    const query = new URLSearchParams();
    if (checklistId) query.append('checklistId', checklistId.toString());
    if (limit) query.append('limit', limit.toString());
    return request<AuditRecord[]>(`/audits/records?${query}`);
  },
  createAuditRecord: (data: { checklistId: number; results: any; score?: number; notes?: string | null }) =>
    request<AuditRecord>('/audits/records', { method: 'POST', body: JSON.stringify(data) }),
  getAuditRecord: (id: number) => request<AuditRecord>(`/audits/records/${id}`),
  updateAuditRecord: (id: number, data: { results?: any; score?: number; findings?: string; recommendations?: string }) =>
    request<AuditRecord>(`/audits/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAuditRecord: (id: number) => request<void>(`/audits/records/${id}`, { method: 'DELETE' }),

  // Documents
  getDocuments: (category?: string) =>
    request<Document[]>(`/documents${category ? `?category=${category}` : ''}`),
  getDocument: (id: number) => request<Document>(`/documents/${id}`),
  createDocument: (data: Partial<Document>) =>
    request<Document>('/documents', { method: 'POST', body: JSON.stringify(data) }),
  updateDocument: (id: number, data: Partial<Document>) =>
    request<Document>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDocument: (id: number) => request<void>(`/documents/${id}`, { method: 'DELETE' }),

  // HACCP Plan
  getCCPs: () => request<CCP[]>('/haccp-plan/ccps'),
  createCCP: (data: Partial<CCP>) =>
    request<CCP>('/haccp-plan/ccps', { method: 'POST', body: JSON.stringify(data) }),
  updateCCP: (id: number, data: Partial<CCP>) =>
    request<CCP>(`/haccp-plan/ccps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCCP: (id: number) => request<void>(`/haccp-plan/ccps/${id}`, { method: 'DELETE' }),
  getHazards: () => request<Hazard[]>('/haccp-plan/hazards'),
  createHazard: (data: Partial<Hazard>) =>
    request<Hazard>('/haccp-plan/hazards', { method: 'POST', body: JSON.stringify(data) }),
  updateHazard: (id: number, data: Partial<Hazard>) =>
    request<Hazard>(`/haccp-plan/hazards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHazard: (id: number) => request<void>(`/haccp-plan/hazards/${id}`, { method: 'DELETE' }),

  // Reports
  generateTemperatureReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/temperature?startDate=${startDate}&endDate=${endDate}`),
  generateTraceabilityReport: (batchNumber: string) =>
    requestBlob(`/reports/traceability/${batchNumber}`),
  generateHACCPReport: () => requestBlob('/reports/haccp-plan'),
  generateProductionReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/production?startDate=${startDate}&endDate=${endDate}`),
  generateCleaningReport: (startDate: string, endDate: string, areaId?: number) =>
    requestBlob(`/reports/cleaning?startDate=${startDate}&endDate=${endDate}${areaId ? `&areaId=${areaId}` : ''}`),
  generatePestControlReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/pest-control?startDate=${startDate}&endDate=${endDate}`),
  generateCuringReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/curing?startDate=${startDate}&endDate=${endDate}`),
  generateAuditsReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/audits?startDate=${startDate}&endDate=${endDate}`),
  generateTrainingsReport: (startDate: string, endDate: string) =>
    requestBlob(`/reports/trainings?startDate=${startDate}&endDate=${endDate}`),

  // Temperature Reading management (Admin)
  updateTemperatureReading: (id: number, data: { temperature?: number; notes?: string; isCompliant?: boolean; readAt?: string }) =>
    request<TemperatureReading>(`/temperature/readings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemperatureReading: (id: number) => request<void>(`/temperature/readings/${id}`, { method: 'DELETE' }),

  // Cleaning Record management (Admin)
  updateCleaningRecord: (id: number, data: any) =>
    request<CleaningRecord>(`/cleaning/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCleaningRecord: (id: number) => request<void>(`/cleaning/records/${id}`, { method: 'DELETE' }),

  // Pest Control Check management (Admin)
  updatePestControlCheck: (id: number, data: any) =>
    request<PestControlCheck>(`/pest-control/checks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePestControlCheck: (id: number) => request<void>(`/pest-control/checks/${id}`, { method: 'DELETE' }),

  // Materials (Materiały/Dodatki)
  getMaterials: () => request<any[]>('/materials'),
  getMaterial: (id: number) => request<any>(`/materials/${id}`),
  createMaterial: (data: any) =>
    request<any>('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: number, data: any) =>
    request<any>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: number) => request<void>(`/materials/${id}`, { method: 'DELETE' }),
  getMaterialReceipts: () => request<any[]>('/materials/receipts/all'),
  createMaterialReceipt: (data: any) =>
    request<any>('/materials/receipts', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterialReceipt: (id: number, data: any) =>
    request<any>(`/materials/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterialReceipt: (id: number) => request<void>(`/materials/receipts/${id}`, { method: 'DELETE' }),

  // Butchering (Rozbior)
  getButcherings: () => request<any[]>('/butchering'),
  getButchering: (id: number) => request<any>(`/butchering/${id}`),
  createButchering: (data: any) =>
    request<any>('/butchering', { method: 'POST', body: JSON.stringify(data) }),
  updateButchering: (id: number, data: any) =>
    request<any>(`/butchering/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteButchering: (id: number) => request<void>(`/butchering/${id}`, { method: 'DELETE' }),
  getAvailableElements: () => request<any[]>('/butchering/elements/available'),

  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Labels / Printing
  // Drukowanie bezpośrednie na drukarkę sieciową Godex (tylko gdy backend ma dostęp do drukarki)
  printCuringLabelDirect: (batchId: number, copies?: number) =>
    request<{ success: boolean; message: string }>(`/labels/print/curing/${batchId}`, { 
      method: 'POST', 
      body: JSON.stringify({ copies: copies || 1 }) 
    }),
  // Otwórz etykietę jako HTML w nowym oknie do wydruku (działa wszędzie)
  openCuringLabelForPrint: (batchId: number) => {
    const token = authToken;
    const url = `${API_URL}/labels/html/curing/${batchId}?token=${token}`;
    window.open(url, '_blank', 'width=400,height=300');
  },
  previewCuringLabel: (batchId: number) =>
    request<any>(`/labels/preview/curing/${batchId}`),
  testPrinter: () =>
    request<{ success: boolean; message: string }>('/labels/test', { method: 'POST' }),

  // Lab Tests (Badania laboratoryjne)
  getLabTestTypes: () => request<any[]>('/lab-tests/types'),
  getActiveLabTestTypes: () => request<any[]>('/lab-tests/types/active'),
  createLabTestType: (data: any) =>
    request<any>('/lab-tests/types', { method: 'POST', body: JSON.stringify(data) }),
  updateLabTestType: (id: number, data: any) =>
    request<any>(`/lab-tests/types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabTestType: (id: number) => request<void>(`/lab-tests/types/${id}`, { method: 'DELETE' }),
  getLabTests: (params?: { typeId?: number; from?: string; to?: string; compliant?: string }) => {
    const query = new URLSearchParams();
    if (params?.typeId) query.append('typeId', params.typeId.toString());
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.compliant) query.append('compliant', params.compliant);
    const queryStr = query.toString();
    return request<any[]>(`/lab-tests${queryStr ? `?${queryStr}` : ''}`);
  },
  getLabTest: (id: number) => request<any>(`/lab-tests/${id}`),
  createLabTest: (data: any) =>
    request<any>('/lab-tests', { method: 'POST', body: JSON.stringify(data) }),
  updateLabTest: (id: number, data: any) =>
    request<any>(`/lab-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabTest: (id: number) => request<void>(`/lab-tests/${id}`, { method: 'DELETE' }),
  getLabTestStats: () => request<any>('/lab-tests/stats/summary'),

  // Waste (Odpady)
  getWasteTypes: () => request<any[]>('/waste/types'),
  getActiveWasteTypes: () => request<any[]>('/waste/types/active'),
  createWasteType: (data: any) =>
    request<any>('/waste/types', { method: 'POST', body: JSON.stringify(data) }),
  updateWasteType: (id: number, data: any) =>
    request<any>(`/waste/types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWasteType: (id: number) => request<void>(`/waste/types/${id}`, { method: 'DELETE' }),
  getWasteCollectors: () => request<any[]>('/waste/collectors'),
  getActiveWasteCollectors: () => request<any[]>('/waste/collectors/active'),
  createWasteCollector: (data: any) =>
    request<any>('/waste/collectors', { method: 'POST', body: JSON.stringify(data) }),
  updateWasteCollector: (id: number, data: any) =>
    request<any>(`/waste/collectors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWasteCollector: (id: number) => request<void>(`/waste/collectors/${id}`, { method: 'DELETE' }),
  getWasteRecords: (params?: { typeId?: number; collectorId?: number; from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.typeId) query.append('typeId', params.typeId.toString());
    if (params?.collectorId) query.append('collectorId', params.collectorId.toString());
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const queryStr = query.toString();
    return request<any[]>(`/waste${queryStr ? `?${queryStr}` : ''}`);
  },
  getWasteRecord: (id: number) => request<any>(`/waste/${id}`),
  createWasteRecord: (data: any) =>
    request<any>('/waste', { method: 'POST', body: JSON.stringify(data) }),
  updateWasteRecord: (id: number, data: any) =>
    request<any>(`/waste/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWasteRecord: (id: number) => request<void>(`/waste/${id}`, { method: 'DELETE' }),
  getWasteStats: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const queryStr = query.toString();
    return request<any>(`/waste/stats/summary${queryStr ? `?${queryStr}` : ''}`);
  },
};

export default api;
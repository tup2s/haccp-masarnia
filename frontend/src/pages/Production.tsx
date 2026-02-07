import { useState, useEffect, useMemo } from 'react';
import { api, ProductionBatch, Product, RawMaterialReception, CuringBatch, MaterialReceipt, User } from '../services/api';
import { PlusIcon, QueueListIcon, EyeIcon, CheckCircleIcon, FireIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { SelectModal, filterByTime, TimeFilter, TIME_FILTERS } from '../components/SelectModal';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useAuth } from '../context/AuthContext';

dayjs.extend(utc);

interface CompletedCuringBatch extends CuringBatch {
  availableQuantity: number;
  productName?: string;
  endDate?: string;
}

export default function Production() {
  const { isAdmin } = useAuth();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receptions, setReceptions] = useState<RawMaterialReception[]>([]);
  const [curingBatches, setCuringBatches] = useState<CompletedCuringBatch[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<MaterialReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null);
  const [viewBatch, setViewBatch] = useState<ProductionBatch | null>(null);
  const [completeModal, setCompleteModal] = useState<ProductionBatch | null>(null);
  const [deleteModal, setDeleteModal] = useState<ProductionBatch | null>(null);
  const [completeData, setCompleteData] = useState({ 
    finalTemperature: '', 
    notes: '',
    endDate: dayjs().format('YYYY-MM-DD'),
    endTime: dayjs().format('HH:mm'),
  });
  const [editCompleteData, setEditCompleteData] = useState({
    finalTemperature: '',
    endDate: dayjs().format('YYYY-MM-DD'),
    endTime: dayjs().format('HH:mm'),
    status: 'IN_PRODUCTION',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  // Stany dla modalnych okienek wyboru surowców
  const [selectModal, setSelectModal] = useState<{
    type: 'reception' | 'curing' | 'material';
    index: number;
  } | null>(null);
  const [selectFilter, setSelectFilter] = useState<TimeFilter>('this_week');
  const [selectSearch, setSelectSearch] = useState('');

  // Modal wyboru produktu
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);

  // Modal dodawania nowego materiału "od ręki"
  const [manualEntryModal, setManualEntryModal] = useState<{
    type: 'reception' | 'curing' | 'material';
    index: number;
  } | null>(null);
  const [manualEntryData, setManualEntryData] = useState({
    name: '',
    batchNumber: '',
    quantity: '',
    unit: 'kg',
  });

  // Typ materiału z opcją ręcznego wpisu
  interface MaterialEntry {
    receptionId?: number;
    curingBatchId?: number;
    materialId?: number;
    materialReceiptId?: number;
    quantity: number;
    unit: string;
    // Dla ręcznych wpisów
    manualEntry?: boolean;
    manualType?: 'reception' | 'curing' | 'material';
    manualName?: string;
    manualBatchNumber?: string;
  }

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    unit: 'kg',
    productionDate: dayjs().format('YYYY-MM-DD'),
    startTime: dayjs().format('HH:mm'),
    expiryDate: '',
    notes: '',
    materials: [] as MaterialEntry[],
  });

  useEffect(() => {
    Promise.all([loadBatches(), loadProducts(), loadReceptions(), loadCuringBatches(), loadAvailableMaterials()]);
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.filter(u => u.isActive));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCuringBatches = async () => {
    try {
      const data = await api.getCompletedCuringBatches();
      setCuringBatches(data);
    } catch (error) {
      console.error('Błąd ładowania partii peklowania');
    }
  };

  const loadAvailableMaterials = async () => {
    try {
      const data = await api.getAvailableMaterials();
      setAvailableMaterials(data);
    } catch (error) {
      console.error('Błąd ładowania dostępnych materiałów');
    }
  };

  const loadBatches = async () => {
    try {
      const data = await api.getProductionBatches();
      setBatches(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania partii');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    const data = await api.getProducts();
    setProducts(data);
  };

  const loadReceptions = async () => {
    const data = await api.getReceptions();
    setReceptions(data.filter((r: RawMaterialReception) => r.isCompliant));
  };

  // Filtrowane listy dla modali wyboru
  const filteredReceptions = useMemo((): RawMaterialReception[] => {
    let filtered = filterByTime(receptions, selectFilter, 'receivedAt') as RawMaterialReception[];
    if (selectSearch.trim()) {
      const search = selectSearch.toLowerCase();
      filtered = filtered.filter(r => 
        r.rawMaterial?.name?.toLowerCase().includes(search) ||
        r.batchNumber?.toLowerCase().includes(search) ||
        r.supplier?.name?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [receptions, selectFilter, selectSearch]);

  const filteredCuringBatches = useMemo((): CompletedCuringBatch[] => {
    let filtered = filterByTime(curingBatches, selectFilter, 'startDate') as CompletedCuringBatch[];
    if (selectSearch.trim()) {
      const search = selectSearch.toLowerCase();
      filtered = filtered.filter(c => 
        c.batchNumber?.toLowerCase().includes(search) ||
        c.productName?.toLowerCase().includes(search) ||
        c.reception?.rawMaterial?.name?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [curingBatches, selectFilter, selectSearch]);

  const filteredMaterials = useMemo((): MaterialReceipt[] => {
    let filtered = filterByTime(availableMaterials, selectFilter, 'receivedAt') as MaterialReceipt[];
    if (selectSearch.trim()) {
      const search = selectSearch.toLowerCase();
      filtered = filtered.filter(m => 
        m.material?.name?.toLowerCase().includes(search) ||
        m.batchNumber?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [availableMaterials, selectFilter, selectSearch]);

  // Otwórz modal wyboru
  const openSelectModal = (type: 'reception' | 'curing' | 'material', index: number) => {
    setSelectModal({ type, index });
    setSelectFilter('this_week');
    setSelectSearch('');
  };

  // Wybierz element z modalu
  const handleSelectItem = (id: number) => {
    if (!selectModal) return;
    const { type, index } = selectModal;
    
    if (type === 'reception') {
      updateMaterial(index, 'receptionId', id);
    } else if (type === 'curing') {
      updateMaterial(index, 'curingBatchId', id);
    } else if (type === 'material') {
      updateMaterial(index, 'materialReceiptId', id);
    }
    
    setSelectModal(null);
  };

  // Pobierz nazwę wybranego elementu
  const getSelectedItemName = (mat: MaterialEntry): string => {
    // Ręczny wpis
    if (mat.manualEntry) {
      const icon = mat.manualType === 'curing' ? '🧂' : mat.manualType === 'material' ? '🌿' : '🥩';
      return `${icon} ${mat.manualName} - ${mat.manualBatchNumber} (ręczny)`;
    }
    if (mat.curingBatchId && mat.curingBatchId > 0) {
      const item = curingBatches.find(c => c.id === mat.curingBatchId);
      return item ? `🧂 ${(item as any).productName || item.reception?.rawMaterial?.name} - ${item.batchNumber}` : 'Wybierz...';
    } else if (mat.materialReceiptId && mat.materialReceiptId > 0) {
      const item = availableMaterials.find(m => m.id === mat.materialReceiptId);
      return item ? `🌿 ${item.material?.name} - ${item.batchNumber}` : 'Wybierz...';
    } else if (mat.receptionId && mat.receptionId > 0) {
      const item = receptions.find(r => r.id === mat.receptionId);
      return item ? `🥩 ${item.rawMaterial?.name} - ${item.batchNumber}` : 'Wybierz...';
    }
    return 'Wybierz...';
  };

  // Otwórz modal ręcznego dodawania
  const openManualEntryModal = (type: 'reception' | 'curing' | 'material', index: number) => {
    setManualEntryModal({ type, index });
    setManualEntryData({ name: '', batchNumber: '', quantity: '', unit: 'kg' });
  };

  // Zatwierdź ręczny wpis
  const handleManualEntry = () => {
    if (!manualEntryModal) return;
    const { type, index } = manualEntryModal;
    
    const newMaterials = [...formData.materials];
    newMaterials[index] = {
      ...newMaterials[index],
      manualEntry: true,
      manualType: type,
      manualName: manualEntryData.name,
      manualBatchNumber: manualEntryData.batchNumber,
      quantity: parseFloat(manualEntryData.quantity) || 0,
      unit: manualEntryData.unit,
    };
    
    setFormData({ ...formData, materials: newMaterials });
    setManualEntryModal(null);
  };

  const openModal = () => {
    const defaultProduct = products[0];
    const defaultExpiry = defaultProduct?.shelfLife 
      ? dayjs().add(defaultProduct.shelfLife, 'day').format('YYYY-MM-DD')
      : dayjs().add(7, 'day').format('YYYY-MM-DD');
    
    setFormData({
      productId: defaultProduct?.id.toString() || '',
      quantity: '',
      unit: 'kg',
      productionDate: dayjs().format('YYYY-MM-DD'),
      startTime: dayjs().format('HH:mm'),
      expiryDate: defaultExpiry,
      notes: '',
      materials: [],
    });
    setEditBatch(null);
    setSelectedUserId('');
    setIsModalOpen(true);
  };

  const openEditModal = (batch: ProductionBatch) => {
    setEditBatch(batch);
    setFormData({
      productId: batch.productId.toString(),
      quantity: batch.quantity.toString(),
      unit: batch.unit,
      productionDate: dayjs(batch.productionDate).format('YYYY-MM-DD'),
      startTime: batch.startTime ? dayjs.utc(batch.startTime).local().format('HH:mm') : dayjs().format('HH:mm'),
      expiryDate: dayjs(batch.expiryDate).format('YYYY-MM-DD'),
      notes: batch.notes || '',
      materials: batch.materials?.map((m: any) => {
        if (m.curingBatchId) {
          return { curingBatchId: m.curingBatchId, quantity: m.quantity, unit: m.unit };
        } else if (m.materialReceiptId) {
          return { materialReceiptId: m.materialReceiptId, materialId: m.materialId, quantity: m.quantity, unit: m.unit };
        } else {
          return { receptionId: m.receptionId || 0, quantity: m.quantity, unit: m.unit };
        }
      }) || [],
    });
    // Load completion data for completed batches
    setEditCompleteData({
      finalTemperature: batch.finalTemperature != null ? batch.finalTemperature.toString() : '',
      endDate: batch.endTime ? dayjs.utc(batch.endTime).local().format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      endTime: batch.endTime ? dayjs.utc(batch.endTime).local().format('HH:mm') : dayjs().format('HH:mm'),
      status: batch.status || 'IN_PRODUCTION',
    });
    setIsModalOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    const expiryDate = product?.shelfLife 
      ? dayjs(formData.productionDate).add(product.shelfLife, 'day').format('YYYY-MM-DD')
      : formData.expiryDate;
    setFormData({ ...formData, productId, expiryDate });
  };

  const addMaterial = (type: 'reception' | 'curing' | 'material') => {
    if (type === 'curing') {
      setFormData({
        ...formData,
        materials: [...formData.materials, { curingBatchId: 0, quantity: 0, unit: 'kg' }],
      });
    } else if (type === 'material') {
      setFormData({
        ...formData,
        materials: [...formData.materials, { materialReceiptId: 0, quantity: 0, unit: 'kg' }],
      });
    } else {
      setFormData({
        ...formData,
        materials: [...formData.materials, { receptionId: 0, quantity: 0, unit: 'kg' }],
      });
    }
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({ ...formData, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = dayjs(`${formData.productionDate} ${formData.startTime}`).toISOString();
      
      // Przygotuj materiały - zarówno z magazynu jak i ręczne
      const validMaterials = formData.materials.filter(m => 
        (m.receptionId && m.receptionId > 0) || 
        (m.curingBatchId && m.curingBatchId > 0) ||
        (m.materialReceiptId && m.materialReceiptId > 0) ||
        (m.manualEntry && m.manualName && m.manualBatchNumber)
      ).map(m => {
        if (m.manualEntry) {
          return {
            manualEntry: true,
            manualType: m.manualType,
            manualName: m.manualName,
            manualBatchNumber: m.manualBatchNumber,
            quantity: m.quantity,
            unit: m.unit,
          };
        }
        return m;
      });
      
      if (editBatch) {
        // Aktualizacja istniejącej partii - pełna edycja
        const updatePayload: any = {
          productId: parseInt(formData.productId),
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          productionDate: formData.productionDate,
          expiryDate: formData.expiryDate,
          startTime: startDateTime,
          notes: formData.notes || undefined,
          materials: validMaterials,
          status: editCompleteData.status,
        };

        // Jeśli partia jest zakończona, dodaj dane zakończenia
        if (editCompleteData.status === 'COMPLETED' && editCompleteData.finalTemperature) {
          const temp = parseFloat(editCompleteData.finalTemperature);
          const product = products.find(p => p.id === parseInt(formData.productId));
          const requiredTemp = product?.requiredTemperature || 72;
          const endDateTime = dayjs(`${editCompleteData.endDate} ${editCompleteData.endTime}`).toISOString();
          updatePayload.finalTemperature = temp;
          updatePayload.temperatureCompliant = temp >= requiredTemp;
          updatePayload.endTime = endDateTime;
        } else if (editCompleteData.status === 'IN_PRODUCTION') {
          // Jeśli zmieniono na W produkcji, wyczyść dane zakończenia
          updatePayload.finalTemperature = null;
          updatePayload.temperatureCompliant = null;
          updatePayload.endTime = null;
        }

        await api.updateProductionBatch(editBatch.id, updatePayload);
        toast.success('Partia produkcyjna zaktualizowana');
      } else {
        // Nowa partia
        const payload = {
          productId: parseInt(formData.productId),
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          productionDate: formData.productionDate,
          startDateTime,
          expiryDate: formData.expiryDate,
          notes: formData.notes || undefined,
          materials: validMaterials,
          userId: selectedUserId || undefined, // Admin może wybrać operatora
        };
        await api.createProductionBatch(payload);
        toast.success('Partia produkcyjna utworzona - status: W produkcji');
      }
      
      setIsModalOpen(false);
      setEditBatch(null);
      setSelectedUserId('');
      loadBatches();
      loadCuringBatches(); // Odśwież dostępne partie peklowania
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const openCompleteModal = (batch: ProductionBatch) => {
    setCompleteModal(batch);
    setCompleteData({ 
      finalTemperature: '', 
      notes: '',
      endDate: dayjs().format('YYYY-MM-DD'),
      endTime: dayjs().format('HH:mm'),
    });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModal) return;

    const temp = parseFloat(completeData.finalTemperature);
    if (isNaN(temp)) {
      toast.error('Podaj prawidłową temperaturę');
      return;
    }

    const requiredTemp = completeModal.product?.requiredTemperature || 72;

    try {
      const endDateTime = dayjs(`${completeData.endDate} ${completeData.endTime}`).toISOString();
      
      await api.completeProductionBatch(completeModal.id, {
        finalTemperature: temp,
        notes: completeData.notes || undefined,
        endDateTime,
      });
      
      if (temp >= requiredTemp) {
        toast.success(`Produkcja zakończona! Temperatura ${temp}°C - ZGODNA (wymagane ≥${requiredTemp}°C)`);
      } else {
        toast.error(`Produkcja zakończona! Temperatura ${temp}°C - NIEZGODNA (wymagane ≥${requiredTemp}°C). Utworzono działanie korygujące.`);
      }
      
      setCompleteModal(null);
      loadBatches();
    } catch (error) {
      toast.error('Błąd podczas kończenia produkcji');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.deleteProductionBatch(deleteModal.id);
      toast.success('Partia produkcyjna usunięta');
      setDeleteModal(null);
      loadBatches();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'RELEASED': return 'badge-success';
      case 'BLOCKED': return 'badge-danger';
      case 'QUARANTINE': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Zakończona';
      case 'RELEASED': return 'Zwolniona';
      case 'BLOCKED': return 'Zablokowana';
      case 'QUARANTINE': return 'Kwarantanna';
      default: return 'W produkcji';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produkcja</h1>
          <p className="text-gray-500 mt-1">Zarządzanie partiami produkcyjnymi z kontrolą obróbki termicznej</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowa partia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FireIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">W produkcji</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'IN_PRODUCTION').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Zakończone dziś</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'COMPLETED' && dayjs(b.endTime).isSame(dayjs(), 'day')).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FireIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Temp. niezgodna</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.temperatureCompliant === false).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr partii</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Koniec</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp. °C</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-meat-600">{batch.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {batch.product?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {batch.quantity} {batch.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {batch.startTime ? dayjs.utc(batch.startTime).local().format('DD.MM HH:mm') : dayjs(batch.productionDate).format('DD.MM.YYYY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {batch.endTime ? dayjs.utc(batch.endTime).local().format('DD.MM HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {batch.finalTemperature !== undefined && batch.finalTemperature !== null ? (
                      <span className={`font-medium ${batch.temperatureCompliant ? 'text-green-600' : 'text-red-600'}`}>
                        {batch.finalTemperature}°C
                        {batch.temperatureCompliant ? ' ✓' : ' ✗'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {batch.status === 'IN_PRODUCTION' && (
                      <button
                        onClick={() => openCompleteModal(batch)}
                        className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                        title="Zakończ produkcję"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Zakończ
                      </button>
                    )}
                    <button
                      onClick={() => setViewBatch(batch)}
                      className="p-1 text-gray-400 hover:text-meat-600"
                      title="Szczegóły"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Edytuj"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(batch)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Usuń"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {batches.length === 0 && (
        <div className="card text-center py-12">
          <QueueListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak partii produkcyjnych</h3>
          <p className="text-gray-500 mt-2">Utwórz pierwszą partię produkcyjną.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editBatch ? 'Edytuj partię produkcyjną' : 'Nowa partia produkcyjna'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Wybór operatora - tylko dla admina */}
                {isAdmin && users.length > 0 && !editBatch && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                    <select
                      className="input"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value ? parseInt(e.target.value) : '')}
                    >
                      <option value="">-- Bieżący użytkownik --</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produkt *</label>
                    <button
                      type="button"
                      onClick={() => setIsProductSelectOpen(true)}
                      className="input w-full text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className={formData.productId ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.productId 
                          ? `📦 ${products.find(p => p.id === parseInt(formData.productId))?.name}` 
                          : 'Wybierz produkt...'}
                      </span>
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="input flex-1"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                      <select
                        className="input w-24"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      >
                        <option value="kg">kg</option>
                        <option value="szt">szt</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data ważności *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Data i godzina rozpoczęcia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczęcia *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      value={formData.productionDate}
                      onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godzina rozpoczęcia *</label>
                    <input
                      type="time"
                      className="input"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Użyte surowce - zawsze widoczne */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Użyte surowce</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addMaterial('reception')}
                          className="text-sm text-meat-600 hover:text-meat-700"
                        >
                          + Surowiec
                        </button>
                        {availableMaterials.length > 0 && (
                          <button
                            type="button"
                            onClick={() => addMaterial('material')}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            + Dodatek
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => addMaterial('curing')}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          + Peklowany
                        </button>
                      </div>
                    </div>
                    {formData.materials.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Opcjonalnie dodaj surowce, dodatki lub elementy peklowane
                      </p>
                    )}
                    {formData.materials.map((mat, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-center">
                        {/* Ręczny wpis */}
                        {mat.manualEntry ? (
                          <div className={`input flex-1 ${
                            mat.manualType === 'curing' ? 'border-purple-300 bg-purple-50' : 
                            mat.manualType === 'material' ? 'border-green-300 bg-green-50' : 
                            'border-orange-300 bg-orange-50'
                          } flex items-center gap-2`}>
                            <span className="text-sm">
                              {mat.manualType === 'curing' ? '🧂' : mat.manualType === 'material' ? '🌿' : '🥩'} {mat.manualName} - {mat.manualBatchNumber}
                            </span>
                            <span className="text-xs text-gray-500">(ręczny)</span>
                          </div>
                        ) : mat.curingBatchId !== undefined ? (
                          // Element peklowany - przycisk otwierający modal lub ręczny wpis
                          <div className="flex flex-1 gap-1">
                            <button
                              type="button"
                              onClick={() => openSelectModal('curing', index)}
                              className="input flex-1 border-purple-300 bg-purple-50 text-left hover:bg-purple-100 transition-colors flex items-center justify-between"
                            >
                              <span className={mat.curingBatchId > 0 ? 'text-gray-900' : 'text-gray-400'}>
                                {getSelectedItemName(mat)}
                              </span>
                              <MagnifyingGlassIcon className="w-4 h-4 text-purple-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openManualEntryModal('curing', index)}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              title="Wpisz ręcznie"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : mat.materialReceiptId !== undefined ? (
                          // Zwykły materiał/dodatek - przycisk otwierający modal lub ręczny wpis
                          <div className="flex flex-1 gap-1">
                            <button
                              type="button"
                              onClick={() => openSelectModal('material', index)}
                              className="input flex-1 border-green-300 bg-green-50 text-left hover:bg-green-100 transition-colors flex items-center justify-between"
                            >
                              <span className={mat.materialReceiptId > 0 ? 'text-gray-900' : 'text-gray-400'}>
                                {getSelectedItemName(mat)}
                              </span>
                              <MagnifyingGlassIcon className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openManualEntryModal('material', index)}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                              title="Wpisz ręcznie"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : (
                          // Zwykły surowiec - przycisk otwierający modal lub ręczny wpis
                          <div className="flex flex-1 gap-1">
                            <button
                              type="button"
                              onClick={() => openSelectModal('reception', index)}
                              className="input flex-1 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                              <span className={mat.receptionId && mat.receptionId > 0 ? 'text-gray-900' : 'text-gray-400'}>
                                {getSelectedItemName(mat)}
                              </span>
                              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openManualEntryModal('reception', index)}
                              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                              title="Wpisz ręcznie"
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          className="input w-24"
                          placeholder="Ilość"
                          value={mat.quantity || ''}
                          onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
                        />
                        <select
                          className="input w-20"
                          value={mat.unit}
                          onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="szt">szt</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="px-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Status i dane zakończenia - tylko w trybie edycji */}
                {editBatch && (
                  <div className="border-t border-gray-200 pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="input"
                        value={editCompleteData.status}
                        onChange={(e) => setEditCompleteData({ ...editCompleteData, status: e.target.value })}
                      >
                        <option value="IN_PRODUCTION">W produkcji</option>
                        <option value="COMPLETED">Zakończona</option>
                        <option value="RELEASED">Zwolniona</option>
                        <option value="BLOCKED">Zablokowana</option>
                        <option value="QUARANTINE">Kwarantanna</option>
                      </select>
                    </div>

                    {editCompleteData.status !== 'IN_PRODUCTION' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperatura wewnętrzna produktu (°C)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="input text-lg font-bold text-center"
                            placeholder="np. 75.5"
                            value={editCompleteData.finalTemperature}
                            onChange={(e) => setEditCompleteData({ ...editCompleteData, finalTemperature: e.target.value })}
                          />
                          {editCompleteData.finalTemperature && (
                            <p className={`text-xs mt-1 ${
                              parseFloat(editCompleteData.finalTemperature) >= (products.find(p => p.id === parseInt(formData.productId))?.requiredTemperature || 72)
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {parseFloat(editCompleteData.finalTemperature) >= (products.find(p => p.id === parseInt(formData.productId))?.requiredTemperature || 72)
                                ? `✓ Zgodna (wymagane ≥${products.find(p => p.id === parseInt(formData.productId))?.requiredTemperature || 72}°C)`
                                : `✗ Niezgodna (wymagane ≥${products.find(p => p.id === parseInt(formData.productId))?.requiredTemperature || 72}°C)`
                              }
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data zakończenia</label>
                            <input
                              type="date"
                              className="input"
                              value={editCompleteData.endDate}
                              onChange={(e) => setEditCompleteData({ ...editCompleteData, endDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Godzina zakończenia</label>
                            <input
                              type="time"
                              className="input"
                              value={editCompleteData.endTime}
                              onChange={(e) => setEditCompleteData({ ...editCompleteData, endTime: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!editBatch && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Info:</strong> Partia zostanie utworzona ze statusem "W produkcji". 
                      Po zakończeniu obróbki termicznej kliknij "Zakończ" i wprowadź osiągniętą temperaturę wewnętrzną produktu.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditBatch(null); }} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editBatch ? 'Zapisz zmiany' : 'Rozpocznij produkcję'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal - Ręczny wpis surowca/peklowanego */}
      {manualEntryModal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setManualEntryModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {manualEntryModal.type === 'curing' ? '🧂 Dodaj produkt peklowany' : 
                 manualEntryModal.type === 'material' ? '🌿 Dodaj dodatek/materiał' : 
                 '🥩 Dodaj surowiec'} (ręcznie)
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Wpisz dane {manualEntryModal.type === 'material' ? 'dodatku' : 'surowca'} który nie był wcześniej wprowadzony do systemu. 
                Jeśli numer partii już istnieje - zostanie użyty z magazynu.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa {manualEntryModal.type === 'curing' ? 'produktu peklowanego' : 
                           manualEntryModal.type === 'material' ? 'dodatku/materiału' : 
                           'surowca'} *
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder={manualEntryModal.type === 'curing' ? 'np. Boczek peklowany' : 
                                 manualEntryModal.type === 'material' ? 'np. Przyprawa do kiełbasy' : 
                                 'np. Łopatka wieprzowa'}
                    value={manualEntryData.name}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, name: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numer partii *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. 20260207 lub własny numer"
                    value={manualEntryData.batchNumber}
                    onChange={(e) => setManualEntryData({ ...manualEntryData, batchNumber: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                      value={manualEntryData.quantity}
                      onChange={(e) => setManualEntryData({ ...manualEntryData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                    <select
                      className="input"
                      value={manualEntryData.unit}
                      onChange={(e) => setManualEntryData({ ...manualEntryData, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="szt">szt</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setManualEntryModal(null)}
                  className="flex-1 btn-secondary"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  disabled={!manualEntryData.name || !manualEntryData.batchNumber || !manualEntryData.quantity}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Production Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setCompleteModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Zakończ produkcję</h2>
              <p className="text-gray-500 mb-4">Partia: <strong>{completeModal.batchNumber}</strong> - {completeModal.product?.name}</p>
              
              <form onSubmit={handleComplete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura wewnętrzna produktu (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input text-2xl font-bold text-center"
                    required
                    placeholder="np. 75.5"
                    value={completeData.finalTemperature}
                    onChange={(e) => setCompleteData({ ...completeData, finalTemperature: e.target.value })}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Wymagana temperatura minimalna: <strong className="text-green-600">≥{completeModal.product?.requiredTemperature || 72}°C</strong>
                  </p>
                </div>

                {/* Data i godzina zakończenia */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data zakończenia</label>
                    <input
                      type="date"
                      className="input"
                      value={completeData.endDate}
                      onChange={(e) => setCompleteData({ ...completeData, endDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godzina zakończenia</label>
                    <input
                      type="time"
                      className="input"
                      value={completeData.endTime}
                      onChange={(e) => setCompleteData({ ...completeData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {completeData.finalTemperature && parseFloat(completeData.finalTemperature) < 72 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      ⚠️ <strong>Uwaga!</strong> Temperatura {completeData.finalTemperature}°C jest poniżej wymaganego minimum 72°C. 
                      Zostanie automatycznie utworzone działanie korygujące.
                    </p>
                  </div>
                )}

                {completeData.finalTemperature && parseFloat(completeData.finalTemperature) >= 72 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✓ Temperatura {completeData.finalTemperature}°C jest zgodna z wymaganiami.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi (opcjonalnie)</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Dodatkowe uwagi..."
                    value={completeData.notes}
                    onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setCompleteModal(null)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Zakończ produkcję
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setDeleteModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Usuń partię produkcyjną</h2>
              <p className="text-gray-500 mb-4">
                Czy na pewno chcesz usunąć partię <strong>{deleteModal.batchNumber}</strong>?
              </p>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ Ta operacja jest nieodwracalna. Wszystkie dane partii oraz powiązane materiały zostaną usunięte.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 btn-secondary">
                  Anuluj
                </button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                  Usuń partię
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setViewBatch(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Partia {viewBatch.batchNumber}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Produkt</p>
                    <p className="font-medium">{viewBatch.product?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ilość</p>
                    <p className="font-medium">{viewBatch.quantity} {viewBatch.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start produkcji</p>
                    <p className="font-medium">
                      {viewBatch.startTime 
                        ? dayjs.utc(viewBatch.startTime).local().format('DD.MM.YYYY HH:mm')
                        : dayjs(viewBatch.productionDate).format('DD.MM.YYYY')
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Koniec produkcji</p>
                    <p className="font-medium">
                      {viewBatch.endTime 
                        ? dayjs.utc(viewBatch.endTime).local().format('DD.MM.YYYY HH:mm')
                        : 'W trakcie'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data ważności</p>
                    <p className="font-medium">{dayjs(viewBatch.expiryDate).format('DD.MM.YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`badge ${getStatusColor(viewBatch.status)}`}>
                      {getStatusLabel(viewBatch.status)}
                    </span>
                  </div>
                </div>

                {/* Temperatura końcowa */}
                {viewBatch.finalTemperature !== undefined && viewBatch.finalTemperature !== null && (
                  <div className={`rounded-lg p-4 ${viewBatch.temperatureCompliant ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-sm text-gray-500 mb-1">Temperatura końcowa (obróbka termiczna)</p>
                    <p className={`text-2xl font-bold ${viewBatch.temperatureCompliant ? 'text-green-600' : 'text-red-600'}`}>
                      {viewBatch.finalTemperature}°C
                      <span className="text-sm font-normal ml-2">
                        {viewBatch.temperatureCompliant 
                          ? '✓ Zgodna' 
                          : `✗ Niezgodna (wymagane ≥${viewBatch.product?.requiredTemperature || 72}°C)`
                        }
                      </span>
                    </p>
                  </div>
                )}

                {viewBatch.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Uwagi</p>
                    <p className="text-sm">{viewBatch.notes}</p>
                  </div>
                )}
                {viewBatch.materials && viewBatch.materials.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Użyte surowce</p>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      {viewBatch.materials.map((mat) => (
                        <div key={mat.id} className="flex justify-between text-sm">
                          <span>{mat.rawMaterial?.name}</span>
                          <span className="text-gray-500">{mat.quantity} {mat.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <button onClick={() => setViewBatch(null)} className="w-full btn-secondary">
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Item Modal - Wybór surowców/peklowania/materiałów */}
      {selectModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setSelectModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectModal.type === 'reception' && '🥩 Wybierz surowiec (dostawę)'}
                    {selectModal.type === 'curing' && '🧂 Wybierz element peklowany'}
                    {selectModal.type === 'material' && '🌿 Wybierz materiał/dodatek'}
                  </h3>
                  <button
                    onClick={() => setSelectModal(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Filtry czasowe */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <FunnelIcon className="w-4 h-4 text-gray-400 mt-1.5" />
                  {TIME_FILTERS.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSelectFilter(f.value)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectFilter === f.value
                          ? 'bg-meat-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Wyszukiwarka */}
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Szukaj po nazwie, numerze partii..."
                    value={selectSearch}
                    onChange={(e) => setSelectSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista elementów */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectModal.type === 'reception' && (
                  <div className="space-y-2">
                    {filteredReceptions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Brak dostaw w wybranym okresie</p>
                    ) : (
                      filteredReceptions.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectItem(r.id)}
                          className="w-full p-3 border border-gray-200 rounded-lg hover:border-meat-400 hover:bg-meat-50 transition-colors text-left flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-meat-700">
                              🥩 {r.rawMaterial?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {r.batchNumber} • {r.quantity} {r.unit} • {r.supplier?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {dayjs(r.receivedAt).format('DD.MM.YYYY')}
                            </p>
                          </div>
                          <span className="text-meat-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Wybierz →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectModal.type === 'curing' && (
                  <div className="space-y-2">
                    {filteredCuringBatches.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Brak partii peklowanych w wybranym okresie</p>
                    ) : (
                      filteredCuringBatches.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectItem(c.id)}
                          className="w-full p-3 border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-left flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-purple-700">
                              🧂 {(c as any).productName || c.reception?.rawMaterial?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {c.batchNumber} • <span className="text-purple-600 font-medium">{c.availableQuantity} {c.unit} dostępne</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              Peklowanie: {dayjs(c.startDate).format('DD.MM')} - {dayjs(c.endDate).format('DD.MM.YYYY')}
                            </p>
                          </div>
                          <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Wybierz →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectModal.type === 'material' && (
                  <div className="space-y-2">
                    {filteredMaterials.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Brak materiałów w wybranym okresie</p>
                    ) : (
                      filteredMaterials.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectItem(m.id)}
                          className="w-full p-3 border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-green-700">
                              🌿 {m.material?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {m.batchNumber} • {m.quantity} {m.material?.unit}
                            </p>
                            <p className="text-xs text-gray-400">
                              {dayjs(m.receivedAt).format('DD.MM.YYYY')}
                            </p>
                          </div>
                          <span className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Wybierz →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setSelectModal(null)}
                  className="w-full btn-secondary"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Select Modal */}
      <SelectModal<Product>
        isOpen={isProductSelectOpen}
        onClose={() => setIsProductSelectOpen(false)}
        onSelect={(product) => {
          handleProductChange(product.id.toString());
          setIsProductSelectOpen(false);
        }}
        title="📦 Wybierz produkt"
        items={products}
        getItemId={(p) => p.id}
        searchFields={['name', 'category', 'description'] as any}
        showTimeFilters={false}
        colorScheme="meat"
        emptyMessage="Brak produktów"
        renderItem={(p) => (
          <div>
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-sm text-gray-500">
              {p.category} • Termin: {p.shelfLife} dni • {p.unit}
            </p>
            {p.description && (
              <p className="text-xs text-gray-400 mt-1">{p.description}</p>
            )}
          </div>
        )}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api, CuringBatch, RawMaterialReception } from '../services/api';
import { PlusIcon, BeakerIcon, EyeIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function Curing() {
  const [batches, setBatches] = useState<CuringBatch[]>([]);
  const [meatReceptions, setMeatReceptions] = useState<RawMaterialReception[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBatch, setViewBatch] = useState<CuringBatch | null>(null);
  const [editBatch, setEditBatch] = useState<CuringBatch | null>(null);
  const [completeModal, setCompleteModal] = useState<CuringBatch | null>(null);
  const [deleteModal, setDeleteModal] = useState<CuringBatch | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeEndDate, setCompleteEndDate] = useState('');
  const [completeEndTime, setCompleteEndTime] = useState('');
  
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'EMPLOYEE';
  const isAdmin = userRole === 'ADMIN';

  const [formData, setFormData] = useState({
    receptionId: '',
    productName: '', // Nazwa peklowanego produktu (główna nazwa)
    quantity: '',
    unit: 'kg',
    curingMethod: 'DRY',
    meatDescription: '', // Dodatkowy opis: tłusta II, chuda II, mięso kl I
    // Suche
    curingSaltAmount: '',
    // Nastrzykowe - solanka
    brineWater: '30',
    brineSalt: '2.4',
    brineMaggi: '0.3',
    brineSugar: '0.2',
    plannedDays: '7',
    startDate: dayjs().format('YYYY-MM-DD'),
    startTime: dayjs().format('HH:mm'),
    temperature: '4',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [batchesData, receptionsData] = await Promise.all([
        api.getCuringBatches(),
        api.getReceptions(100),
      ]);
      setBatches(batchesData);
      // Filtruj tylko mięso
      setMeatReceptions(receptionsData.filter((r: RawMaterialReception) => 
        r.isCompliant && r.rawMaterial?.category === 'MEAT'
      ));
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      receptionId: '',
      productName: '',
      quantity: '',
      unit: 'kg',
      curingMethod: 'DRY',
      meatDescription: '',
      curingSaltAmount: '0.25',
      brineWater: '30',
      brineSalt: '2.4',
      brineMaggi: '0.3',
      brineSugar: '0.2',
      plannedDays: '7',
      startDate: dayjs().format('YYYY-MM-DD'),
      startTime: dayjs().format('HH:mm'),
      temperature: '4',
      notes: '',
    });
    setEditBatch(null);
    setIsModalOpen(true);
  };

  const openEditModal = (batch: CuringBatch) => {
    setEditBatch(batch);
    setFormData({
      receptionId: batch.receptionId.toString(),
      productName: batch.productName || '',
      quantity: batch.quantity.toString(),
      unit: batch.unit,
      curingMethod: batch.curingMethod,
      meatDescription: batch.meatDescription || '',
      curingSaltAmount: batch.curingSaltAmount?.toString() || '0.25',
      brineWater: batch.brineWater?.toString() || '30',
      brineSalt: batch.brineSalt?.toString() || '2.4',
      brineMaggi: batch.brineMaggi?.toString() || '0.3',
      brineSugar: batch.brineSugar?.toString() || '0.2',
      plannedDays: dayjs(batch.plannedEndDate).diff(dayjs(batch.startDate), 'day').toString(),
      startDate: dayjs.utc(batch.startDate).local().format('YYYY-MM-DD'),
      startTime: dayjs.utc(batch.startDate).local().format('HH:mm'),
      temperature: batch.temperature?.toString() || '4',
      notes: batch.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleReceptionChange = (receptionId: string) => {
    const reception = meatReceptions.find(r => r.id === parseInt(receptionId));
    const quantity = reception ? reception.quantity : 0;
    
    // Oblicz sól peklową dla suchego: 0.25 kg na 20 kg mięsa
    const saltAmount = (quantity / 20) * 0.25;
    
    setFormData({
      ...formData,
      receptionId,
      quantity: reception ? reception.quantity.toString() : '',
      unit: reception?.unit || 'kg',
      curingSaltAmount: saltAmount.toFixed(2),
    });
  };

  // Przelicz sól przy zmianie ilości mięsa
  const handleQuantityChange = (value: string) => {
    const quantity = parseFloat(value) || 0;
    const saltAmount = (quantity / 20) * 0.25;
    setFormData({
      ...formData,
      quantity: value,
      curingSaltAmount: saltAmount.toFixed(2),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = dayjs(`${formData.startDate} ${formData.startTime}`).toISOString();
      
      const payload: any = {
        receptionId: parseInt(formData.receptionId),
        productName: formData.productName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        curingMethod: formData.curingMethod,
        meatDescription: formData.meatDescription || undefined,
        plannedDays: parseInt(formData.plannedDays),
        startDate: startDateTime,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        notes: formData.notes || undefined,
      };

      if (formData.curingMethod === 'DRY') {
        payload.curingSaltAmount = parseFloat(formData.curingSaltAmount);
      } else {
        payload.brineWater = parseFloat(formData.brineWater);
        payload.brineSalt = parseFloat(formData.brineSalt);
        payload.brineMaggi = parseFloat(formData.brineMaggi);
        payload.brineSugar = parseFloat(formData.brineSugar);
      }

      if (editBatch) {
        // Aktualizacja
        const plannedEndDate = dayjs(startDateTime).add(parseInt(formData.plannedDays), 'day').toISOString();
        await api.updateCuringBatch(editBatch.id, {
          ...payload,
          startDate: startDateTime,
          plannedEndDate,
        });
        toast.success('Partia peklowania zaktualizowana');
      } else {
        // Nowa partia
        await api.createCuringBatch(payload);
        toast.success('Partia peklowania utworzona');
      }
      
      setIsModalOpen(false);
      setEditBatch(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleComplete = async () => {
    if (!completeModal) return;
    try {
      let endDateTime: string | undefined;
      if (completeEndDate && completeEndTime) {
        endDateTime = dayjs(`${completeEndDate} ${completeEndTime}`).toISOString();
      } else if (completeEndDate) {
        endDateTime = dayjs(`${completeEndDate} ${dayjs().format('HH:mm')}`).toISOString();
      }
      
      await api.completeCuringBatch(completeModal.id, completeNotes || undefined, endDateTime);
      toast.success('Peklowanie zakończone! Mięso gotowe do produkcji.');
      setCompleteModal(null);
      setCompleteNotes('');
      setCompleteEndDate('');
      setCompleteEndTime('');
      loadData();
    } catch (error) {
      toast.error('Błąd podczas kończenia peklowania');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.deleteCuringBatch(deleteModal.id);
      toast.success('Partia peklowania usunięta');
      setDeleteModal(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const handlePrintLabel = (batch: CuringBatch) => {
    // Otwórz etykietę w nowym oknie - użytkownik może wydrukować na dowolnej drukarce
    api.openCuringLabelForPrint(batch.id);
    toast.success('Otwarto etykietę do wydruku');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Zakończone';
      case 'CANCELLED': return 'Anulowane';
      default: return 'W trakcie';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'DRY': return 'Suche';
      case 'INJECTION': return 'Nastrzykowe';
      default: return method;
    }
  };

  const getDaysRemaining = (plannedEndDate: string) => {
    const days = dayjs(plannedEndDate).diff(dayjs(), 'day');
    if (days < 0) return <span className="text-red-600 font-medium">Przekroczono o {Math.abs(days)} dni</span>;
    if (days === 0) return <span className="text-orange-600 font-medium">Dziś</span>;
    return <span className="text-green-600">{days} dni</span>;
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
          <h1 className="text-2xl font-bold text-gray-900">Peklowanie</h1>
          <p className="text-gray-500 mt-1">Zarządzanie procesem peklowania mięsa (azotynowa sól peklująca)</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">W trakcie peklowania</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'IN_PROGRESS').length}
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
              <p className="text-sm text-gray-500">Gotowe do produkcji</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'COMPLETED' && dayjs(b.actualEndDate).isAfter(dayjs().subtract(7, 'day'))).length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Przekroczone</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'IN_PROGRESS' && dayjs(b.plannedEndDate).isBefore(dayjs())).length}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt peklowany</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partia dostawy</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metoda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Do końca</th>
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
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{batch.productName || batch.reception?.rawMaterial?.name || '-'}</div>
                    {batch.meatDescription && (
                      <div className="text-amber-600 text-xs mt-1">{batch.meatDescription}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-gray-700">{batch.reception?.batchNumber}</div>
                    <div className="text-gray-500 text-xs">{batch.reception?.rawMaterial?.name}</div>
                    <div className="text-gray-400 text-xs">{batch.reception?.supplier?.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {batch.quantity} {batch.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getMethodLabel(batch.curingMethod)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {dayjs.utc(batch.startDate).local().format('DD.MM.YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {batch.status === 'IN_PROGRESS' ? (
                      getDaysRemaining(batch.plannedEndDate)
                    ) : (
                      <span className="text-gray-500">
                        {batch.actualEndDate ? dayjs.utc(batch.actualEndDate).local().format('DD.MM.YYYY HH:mm') : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(batch.status)}`}>
                      {getStatusLabel(batch.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {batch.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          setCompleteModal(batch);
                          setCompleteNotes('');
                          setCompleteEndDate(dayjs().format('YYYY-MM-DD'));
                          setCompleteEndTime(dayjs().format('HH:mm'));
                        }}
                        className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                        title="Zakończ peklowanie"
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
                    <button
                      onClick={() => handlePrintLabel(batch)}
                      className="p-1 text-gray-400 hover:text-purple-600"
                      title="Drukuj etykietę"
                    >
                      <PrinterIcon className="w-5 h-5" />
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
          <BeakerIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak partii peklowania</h3>
          <p className="text-gray-500 mt-2">Rozpocznij peklowanie mięsa do produkcji wędlin.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editBatch ? 'Edytuj partię peklowania' : 'Nowa partia peklowania'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nazwa peklowanego produktu - główna nazwa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa peklowanego produktu *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. Karkówka na szynkę wiejską, Schab peklowany..."
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Główna nazwa produktu peklowanego</p>
                </div>

                {/* Wybór partii dostawy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partia dostawy (surowiec) *</label>
                  <select
                    className="input"
                    required
                    value={formData.receptionId}
                    onChange={(e) => handleReceptionChange(e.target.value)}
                    disabled={!!editBatch}
                  >
                    <option value="">Wybierz partię dostawy mięsa</option>
                    {meatReceptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        📦 {r.batchNumber} | {r.rawMaterial?.name} | {r.quantity} {r.unit} | {r.supplier?.name} | {dayjs(r.receivedAt).format('DD.MM.YYYY')}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Wybierz konkretną partię dostawy z przyjęcia mięsa</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość mięsa (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                      value={formData.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metoda peklowania *</label>
                    <select
                      className="input"
                      required
                      value={formData.curingMethod}
                      onChange={(e) => setFormData({ ...formData, curingMethod: e.target.value })}
                    >
                      <option value="DRY">Suche (sól peklowa na mięso)</option>
                      <option value="INJECTION">Nastrzykowe (solanka)</option>
                    </select>
                  </div>
                </div>

                {/* Dodatkowy opis mięsa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dodatkowy opis (opcjonalnie)</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="np. tłusta II, chuda II, mięso kl I, z kością..."
                    value={formData.meatDescription}
                    onChange={(e) => setFormData({ ...formData, meatDescription: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Szczegóły dotyczące mięsa w tej partii</p>
                </div>

                {/* Suche peklowanie */}
                {formData.curingMethod === 'DRY' && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 mb-3">Peklowanie suche</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Norma: 0,25 kg soli peklowej azotynowej na 20 kg mięsa
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sól peklowa azotynowa (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={formData.curingSaltAmount}
                        onChange={(e) => setFormData({ ...formData, curingSaltAmount: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Nastrzykowe peklowanie */}
                {formData.curingMethod === 'INJECTION' && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Peklowanie nastrzykowe - Solanka</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Standard: 30L wody, 2,4 kg soli peklowej, 0,3 kg Maggi, 0,2 kg cukru
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Woda (L)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="input"
                          value={formData.brineWater}
                          onChange={(e) => setFormData({ ...formData, brineWater: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sól peklowa (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          value={formData.brineSalt}
                          onChange={(e) => setFormData({ ...formData, brineSalt: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maggi (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          value={formData.brineMaggi}
                          onChange={(e) => setFormData({ ...formData, brineMaggi: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cukier (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input"
                          value={formData.brineSugar}
                          onChange={(e) => setFormData({ ...formData, brineSugar: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data rozpoczęcia</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godzina rozpoczęcia</label>
                    <input
                      type="time"
                      className="input"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Czas peklowania (dni) *</label>
                    <input
                      type="number"
                      className="input"
                      required
                      min="1"
                      value={formData.plannedDays}
                      onChange={(e) => setFormData({ ...formData, plannedDays: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Koniec: {dayjs(formData.startDate).add(parseInt(formData.plannedDays) || 0, 'day').format('DD.MM.YYYY')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp. peklowania (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                  </div>
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

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditBatch(null); }} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editBatch ? 'Zapisz zmiany' : 'Rozpocznij peklowanie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setCompleteModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Zakończ peklowanie</h2>
              <p className="text-gray-500 mb-4">
                Partia: <strong>{completeModal.batchNumber}</strong><br />
                Produkt: <strong>{completeModal.productName}</strong><br />
                {completeModal.quantity} {completeModal.unit} (partia dostawy: {completeModal.reception?.batchNumber})
              </p>

              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  ✓ Mięso będzie oznaczone jako gotowe do użycia w produkcji wędlin.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data zakończenia</label>
                  <input
                    type="date"
                    className="input"
                    value={completeEndDate}
                    onChange={(e) => setCompleteEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Godzina zakończenia</label>
                  <input
                    type="time"
                    className="input"
                    value={completeEndTime}
                    onChange={(e) => setCompleteEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi (opcjonalnie)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Stan mięsa, uwagi..."
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setCompleteModal(null)} className="flex-1 btn-secondary">
                  Anuluj
                </button>
                <button onClick={handleComplete} className="flex-1 btn-primary">
                  Zakończ peklowanie
                </button>
              </div>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Usuń partię peklowania</h2>
              <p className="text-gray-500 mb-4">
                Czy na pewno chcesz usunąć partię <strong>{deleteModal.batchNumber}</strong>?
              </p>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ Ta operacja jest nieodwracalna. Wszystkie dane partii zostaną usunięte.
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
                Partia peklowania {viewBatch.batchNumber}
              </h2>
              <div className="space-y-4">
                {/* Nazwa peklowanego produktu */}
                <div className="bg-meat-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-meat-800 mb-1">Produkt peklowany</p>
                  <p className="text-lg font-semibold text-meat-900">{viewBatch.productName || viewBatch.reception?.rawMaterial?.name || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nr partii dostawy</p>
                    <p className="font-medium">{viewBatch.reception?.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Surowiec z dostawy</p>
                    <p className="font-medium">{viewBatch.reception?.rawMaterial?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dostawca</p>
                    <p className="font-medium">{viewBatch.reception?.supplier?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ilość</p>
                    <p className="font-medium">{viewBatch.quantity} {viewBatch.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Metoda</p>
                    <p className="font-medium">{getMethodLabel(viewBatch.curingMethod)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start peklowania</p>
                    <p className="font-medium">{dayjs.utc(viewBatch.startDate).local().format('DD.MM.YYYY HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Planowany koniec</p>
                    <p className="font-medium">{dayjs(viewBatch.plannedEndDate).format('DD.MM.YYYY')}</p>
                  </div>
                  {viewBatch.actualEndDate && (
                    <div>
                      <p className="text-sm text-gray-500">Rzeczywisty koniec</p>
                      <p className="font-medium">{dayjs.utc(viewBatch.actualEndDate).local().format('DD.MM.YYYY HH:mm')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`badge ${getStatusColor(viewBatch.status)}`}>
                      {getStatusLabel(viewBatch.status)}
                    </span>
                  </div>
                </div>

                {/* Dodatkowy opis mięsa */}
                {viewBatch.meatDescription && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800 mb-1">Dodatkowy opis</p>
                    <p className="text-amber-900">{viewBatch.meatDescription}</p>
                  </div>
                )}

                {/* Parametry peklowania */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Parametry peklowania</p>
                  {viewBatch.curingMethod === 'DRY' ? (
                    <div className="text-sm">
                      <span className="text-gray-500">Sól peklowa azotynowa:</span>{' '}
                      <span className="font-medium">{viewBatch.curingSaltAmount ? `${viewBatch.curingSaltAmount} kg` : '-'}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Woda:</span>{' '}
                        <span className="font-medium">{viewBatch.brineWater ? `${viewBatch.brineWater} L` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sól peklowa:</span>{' '}
                        <span className="font-medium">{viewBatch.brineSalt ? `${viewBatch.brineSalt} kg` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Maggi:</span>{' '}
                        <span className="font-medium">{viewBatch.brineMaggi ? `${viewBatch.brineMaggi} kg` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cukier:</span>{' '}
                        <span className="font-medium">{viewBatch.brineSugar ? `${viewBatch.brineSugar} kg` : '-'}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Temperatura:</span>{' '}
                    <span className="font-medium">{viewBatch.temperature ? `${viewBatch.temperature}°C` : '-'}</span>
                  </div>
                </div>

                {viewBatch.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Uwagi</p>
                    <p className="text-sm">{viewBatch.notes}</p>
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  ScissorsIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { api, RawMaterialReception } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ButcheringElement {
  id?: number;
  elementName: string;
  quantity: number;
  destination: string;
  notes: string;
}

interface Butchering {
  id: number;
  receptionId: number;
  batchNumber: string;
  butcheringDate: string;
  notes: string | null;
  elements: ButcheringElement[];
}

const MEAT_ELEMENTS = [
  'Szynka',
  'Łopatka',
  'Schab',
  'Karkówka',
  'Boczek',
  'Żeberka',
  'Golonka',
  'Podgardle',
  'Polędwiczka',
  'Noga',
  'Łata',
  'Kości',
  'Odpadki',
];

const DESTINATIONS = [
  { value: 'PRODUCTION', label: 'Produkcja' },
  { value: 'CURING', label: 'Peklowanie' },
  { value: 'SALE', label: 'Sprzedaż' },
  { value: 'WASTE', label: 'Odpady' },
];

export default function Butchering() {
  const { user } = useAuth();
  const [butcherings, setButcherings] = useState<Butchering[]>([]);
  const [receptions, setReceptions] = useState<RawMaterialReception[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Butchering | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editingButchering, setEditingButchering] = useState<Butchering | null>(null);

  // Form state
  const [selectedReception, setSelectedReception] = useState<RawMaterialReception | null>(null);
  const [butcheringDate, setButcheringDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [elements, setElements] = useState<ButcheringElement[]>([
    { elementName: '', quantity: 0, destination: 'PRODUCTION', notes: '' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [butcheringsRes, receptionsRes] = await Promise.all([
        api.getButcherings(),
        api.getReceptions(),
      ]);
      setButcherings(butcheringsRes);
      // Filtruj tylko przyjęcia mięsa (półtusze, tusze)
      const meatReceptions = receptionsRes.filter((r: RawMaterialReception) => 
        r.rawMaterial?.category === 'MEAT' || 
        r.rawMaterial?.name?.toLowerCase().includes('tusz') ||
        r.rawMaterial?.name?.toLowerCase().includes('półtusz')
      );
      setReceptions(meatReceptions.length > 0 ? meatReceptions : receptionsRes);
    } catch (error) {
      console.error('Błąd ładowania:', error);
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReception) {
      toast.error('Wybierz przyjęcie');
      return;
    }

    const validElements = elements.filter(el => el.elementName && el.quantity > 0);
    if (validElements.length === 0) {
      toast.error('Dodaj przynajmniej jeden element');
      return;
    }

    try {
      const data = {
        receptionId: selectedReception.id,
        batchNumber: selectedReception.batchNumber,
        butcheringDate,
        notes: notes || null,
        elements: validElements,
      };

      if (editingButchering) {
        await api.updateButchering(editingButchering.id, data);
        toast.success('Rozbior zaktualizowany');
      } else {
        await api.createButchering(data);
        toast.success('Rozbior zarejestrowany');
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteButchering(id);
      toast.success('Rozbior usunięty');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const addElement = () => {
    setElements([...elements, { elementName: '', quantity: 0, destination: 'PRODUCTION', notes: '' }]);
  };

  const removeElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const updateElement = (index: number, field: keyof ButcheringElement, value: string | number) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], [field]: value };
    setElements(updated);
  };

  const resetForm = () => {
    setEditingButchering(null);
    setSelectedReception(null);
    setButcheringDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setElements([{ elementName: '', quantity: 0, destination: 'PRODUCTION', notes: '' }]);
  };

  const openEditModal = (butchering: Butchering) => {
    setEditingButchering(butchering);
    const reception = receptions.find(r => r.id === butchering.receptionId);
    setSelectedReception(reception || null);
    setButcheringDate(new Date(butchering.butcheringDate).toISOString().split('T')[0]);
    setNotes(butchering.notes || '');
    setElements(butchering.elements.map(el => ({
      elementName: el.elementName,
      quantity: el.quantity,
      destination: el.destination || 'PRODUCTION',
      notes: el.notes || '',
    })));
    setShowModal(true);
  };

  const getTotalWeight = () => {
    return elements.reduce((sum, el) => sum + (el.quantity || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rozbior</h1>
          <p className="text-gray-500 mt-1">Rozbior półtusz na elementy</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nowy rozbior
        </button>
      </div>

      {/* Butcherings List */}
      <div className="space-y-4">
        {butcherings.map((butchering) => (
          <div key={butchering.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <ScissorsIcon className="w-5 h-5 text-meat-600" />
                  <h3 className="font-semibold text-gray-900">
                    Partia: {butchering.batchNumber}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Data rozbioru: {new Date(butchering.butcheringDate).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDetailsModal(butchering)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Szczegóły"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openEditModal(butchering)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edytuj"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowDeleteConfirm(butchering.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Usuń"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Elements summary */}
            <div className="mt-4 flex flex-wrap gap-2">
              {butchering.elements.map((el, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {el.elementName}: {el.quantity} kg
                </span>
              ))}
            </div>

            {butchering.notes && (
              <p className="mt-3 text-sm text-gray-600 italic">
                {butchering.notes}
              </p>
            )}
          </div>
        ))}

        {butcherings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ScissorsIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Brak zarejestrowanych rozbiorów</p>
            <p className="text-sm mt-1">Dodaj nowy rozbior półtuszy</p>
          </div>
        )}
      </div>

      {/* Modal - Nowy/Edycja rozbioru */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingButchering ? 'Edytuj rozbior' : 'Nowy rozbior'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Wybór przyjęcia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przyjęcie (półtusza) *
                  </label>
                  <select
                    className="input"
                    value={selectedReception?.id || ''}
                    onChange={(e) => {
                      const rec = receptions.find(r => r.id === parseInt(e.target.value));
                      setSelectedReception(rec || null);
                    }}
                    required
                  >
                    <option value="">-- wybierz przyjęcie --</option>
                    {receptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.batchNumber} - {r.rawMaterial?.name || 'Surowiec'} ({r.quantity} {r.unit}) 
                        - {new Date(r.receivedAt).toLocaleDateString('pl-PL')}
                      </option>
                    ))}
                  </select>
                  {selectedReception && (
                    <p className="mt-1 text-sm text-gray-500">
                      Dostawca: {selectedReception.supplier?.name || '-'}
                    </p>
                  )}
                </div>

                {/* Data rozbioru */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data rozbioru *
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={butcheringDate}
                    onChange={(e) => setButcheringDate(e.target.value)}
                    required
                  />
                </div>

                {/* Elementy */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Elementy z rozbioru *</label>
                    <span className="text-sm text-gray-500">
                      Suma: {getTotalWeight().toFixed(1)} kg
                      {selectedReception && (
                        <span className={getTotalWeight() > selectedReception.quantity ? 'text-red-600' : ''}>
                          {' '}/ {selectedReception.quantity} kg
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {elements.map((element, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <select
                            className="input text-sm"
                            value={element.elementName}
                            onChange={(e) => updateElement(index, 'elementName', e.target.value)}
                          >
                            <option value="">-- element --</option>
                            {MEAT_ELEMENTS.map(el => (
                              <option key={el} value={el}>{el}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            step="0.1"
                            className="input text-sm"
                            placeholder="kg"
                            value={element.quantity || ''}
                            onChange={(e) => updateElement(index, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="w-32">
                          <select
                            className="input text-sm"
                            value={element.destination}
                            onChange={(e) => updateElement(index, 'destination', e.target.value)}
                          >
                            {DESTINATIONS.map(d => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                        {elements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeElement(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addElement}
                    className="mt-2 text-sm text-meat-600 hover:text-meat-700 font-medium"
                  >
                    + Dodaj element
                  </button>
                </div>

                {/* Uwagi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dodatkowe informacje..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingButchering ? 'Zapisz' : 'Zarejestruj rozbior'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Szczegóły */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Szczegóły rozbioru</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nr partii</p>
                  <p className="font-semibold">{showDetailsModal.batchNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Data rozbioru</p>
                  <p className="font-medium">
                    {new Date(showDetailsModal.butcheringDate).toLocaleDateString('pl-PL')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Elementy</p>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-2 py-1">Element</th>
                        <th className="text-right px-2 py-1">Ilość</th>
                        <th className="text-left px-2 py-1">Przeznaczenie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetailsModal.elements.map((el, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{el.elementName}</td>
                          <td className="text-right px-2 py-1">{el.quantity} kg</td>
                          <td className="px-2 py-1">
                            {DESTINATIONS.find(d => d.value === el.destination)?.label || el.destination}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t font-semibold bg-gray-50">
                        <td className="px-2 py-1">RAZEM</td>
                        <td className="text-right px-2 py-1">
                          {showDetailsModal.elements.reduce((sum, el) => sum + el.quantity, 0).toFixed(1)} kg
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {showDetailsModal.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Uwagi</p>
                    <p className="text-gray-700">{showDetailsModal.notes}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetailsModal(null)}
                className="btn-secondary w-full mt-6"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-2">Potwierdź usunięcie</h3>
            <p className="text-gray-600 mb-4">Czy na pewno chcesz usunąć ten rozbior?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

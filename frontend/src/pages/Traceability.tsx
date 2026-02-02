import { useState, useEffect } from 'react';
import { api, ProductionBatch } from '../services/api';
import { MagnifyingGlassIcon, QueueListIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function Traceability() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<ProductionBatch[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchBatch, setSearchBatch] = useState('');
  const [result, setResult] = useState<{ batch: ProductionBatch; timeline: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    // Filtruj partie na podstawie wyszukiwania
    let filtered = batches;
    
    if (searchProduct.trim()) {
      filtered = filtered.filter(b => 
        b.product?.name?.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }
    
    if (searchBatch.trim()) {
      filtered = filtered.filter(b => 
        b.batchNumber?.toLowerCase().includes(searchBatch.toLowerCase())
      );
    }
    
    setFilteredBatches(filtered);
  }, [batches, searchProduct, searchBatch]);

  const loadBatches = async () => {
    try {
      const data = await api.getProductionBatches({ limit: 200 });
      setBatches(data);
      setFilteredBatches(data);
    } catch (error) {
      toast.error('Błąd ładowania partii');
    } finally {
      setIsLoading(false);
    }
  };

  const showTraceability = async (batch: ProductionBatch) => {
    setIsSearching(true);
    try {
      const data = await api.getTraceability(batch.id);
      setResult(data);
    } catch (error) {
      toast.error('Błąd pobierania danych traceability');
    } finally {
      setIsSearching(false);
    }
  };

  const closeDetails = () => {
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Traceability</h1>
        <p className="text-gray-500 mt-1">Śledzenie pochodzenia i historii partii produkcyjnych</p>
      </div>

      {/* Search Filters */}
      <div className="card">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Szukaj po produkcie</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="np. Kiełbasa, Szynka..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Szukaj po numerze partii</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="np. 20260201"
                value={searchBatch}
                onChange={(e) => setSearchBatch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Znaleziono: <strong>{filteredBatches.length}</strong> partii
        </p>
      </div>

      {/* Batches List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr partii</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data produkcji</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data ważności</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBatches.slice(0, 50).map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-meat-600">{batch.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{batch.product?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{batch.quantity} {batch.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {dayjs(batch.productionDate).format('DD.MM.YYYY')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {dayjs(batch.expiryDate).format('DD.MM.YYYY')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      batch.status === 'RELEASED' ? 'badge-success' :
                      batch.status === 'BLOCKED' ? 'badge-danger' :
                      batch.status === 'IN_PRODUCTION' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {batch.status === 'RELEASED' ? 'Zwolniona' :
                       batch.status === 'BLOCKED' ? 'Zablokowana' :
                       batch.status === 'IN_PRODUCTION' ? 'W produkcji' :
                       batch.status === 'COMPLETED' ? 'Zakończona' : batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => showTraceability(batch)}
                      className="btn-secondary text-sm flex items-center gap-1 ml-auto"
                      disabled={isSearching}
                    >
                      <EyeIcon className="w-4 h-4" />
                      Pokaż historię
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBatches.length > 50 && (
          <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
            Wyświetlono 50 z {filteredBatches.length} partii. Użyj filtrów, aby zawęzić wyniki.
          </div>
        )}
      </div>

      {filteredBatches.length === 0 && (
        <div className="card text-center py-12">
          <QueueListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak partii</h3>
          <p className="text-gray-500 mt-2">
            {searchProduct || searchBatch 
              ? 'Nie znaleziono partii pasujących do kryteriów wyszukiwania.'
              : 'Brak partii produkcyjnych w systemie.'}
          </p>
        </div>
      )}

      {/* Traceability Details Modal */}
      {result && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen p-4 pt-16">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={closeDetails}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Traceability: {result.batch.product?.name}
                  </h2>
                  <p className="text-gray-500">Partia: <span className="font-mono font-medium">{result.batch.batchNumber}</span></p>
                </div>
                <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>

              {/* Batch Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ilość</p>
                    <p className="font-medium">{result.batch.quantity} {result.batch.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data produkcji</p>
                    <p className="font-medium">{dayjs(result.batch.productionDate).format('DD.MM.YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data ważności</p>
                    <p className="font-medium">{dayjs(result.batch.expiryDate).format('DD.MM.YYYY')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`badge ${
                      result.batch.status === 'RELEASED' ? 'badge-success' :
                      result.batch.status === 'BLOCKED' ? 'badge-danger' :
                      'badge-info'
                    }`}>
                      {result.batch.status === 'RELEASED' ? 'Zwolniona' :
                       result.batch.status === 'BLOCKED' ? 'Zablokowana' :
                       result.batch.status === 'IN_PRODUCTION' ? 'W produkcji' :
                       result.batch.status === 'COMPLETED' ? 'Zakończona' : result.batch.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Historia partii</h3>
              <div className="relative mb-6">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {result.timeline.map((event, index) => (
                    <div key={index} className="relative flex gap-4 pl-10">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
                        event.type === 'RECEPTION' ? 'bg-blue-500' :
                        event.type === 'PRODUCTION' ? 'bg-green-500' :
                        event.type === 'CURING' ? 'bg-purple-500' :
                        event.type === 'MATERIAL' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {dayjs.utc(event.date).local().format('DD.MM.YYYY HH:mm')}
                            </p>
                          </div>
                          <span className={`badge text-xs ${
                            event.type === 'RECEPTION' ? 'badge-info' :
                            event.type === 'PRODUCTION' ? 'badge-success' :
                            event.type === 'CURING' ? 'bg-purple-100 text-purple-800' :
                            event.type === 'MATERIAL' ? 'bg-orange-100 text-orange-800' :
                            'badge-warning'
                          }`}>
                            {event.type === 'RECEPTION' ? 'Przyjęcie' : 
                             event.type === 'PRODUCTION' ? 'Produkcja' :
                             event.type === 'CURING' ? 'Peklowanie' :
                             event.type === 'MATERIAL' ? 'Materiał' : event.type}
                          </span>
                        </div>
                        {event.details && (
                          <div className="mt-2 grid sm:grid-cols-2 gap-1 text-xs">
                            {Object.entries(event.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}: </span>
                                <span className="text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials Used */}
              {result.batch.materials && result.batch.materials.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Użyte surowce i składniki</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Surowiec/Materiał</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Partia</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dostawca</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.batch.materials.map((mat: any) => (
                          <tr key={mat.id}>
                            <td className="px-3 py-2 text-gray-900">
                              {mat.rawMaterial?.name || mat.curingBatch?.productName || mat.material?.name || mat.materialReceipt?.material?.name || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-900">{mat.quantity} {mat.unit}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                              {mat.reception?.batchNumber || mat.curingBatch?.batchNumber || mat.materialReceipt?.batchNumber || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {mat.reception?.supplier?.name || mat.curingBatch?.reception?.supplier?.name || mat.materialReceipt?.supplier?.name || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-end">
                <button onClick={closeDetails} className="btn-secondary">
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

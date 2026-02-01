import { useState } from 'react';
import { api, ProductionBatch } from '../services/api';
import { MagnifyingGlassIcon, QueueListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function Traceability() {
  const [batchNumber, setBatchNumber] = useState('');
  const [result, setResult] = useState<{ batch: ProductionBatch; timeline: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) return;

    setIsSearching(true);
    try {
      const data = await api.getTraceability(batchNumber.trim());
      setResult(data);
    } catch (error) {
      toast.error('Partia nie znaleziona');
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Traceability</h1>
        <p className="text-gray-500 mt-1">Śledzenie pochodzenia i historii partii produkcyjnych</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              className="input"
              placeholder="Wprowadź numer partii (np. 20240121-001)"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
          </div>
          <button type="submit" disabled={isSearching} className="btn-primary flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            {isSearching ? 'Szukam...' : 'Szukaj'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Batch Info */}
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-meat-100 rounded-lg">
                <QueueListIcon className="w-8 h-8 text-meat-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  Partia: {result.batch.batchNumber}
                </h2>
                <p className="text-gray-600">{result.batch.product?.name}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
                      {result.batch.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Historia partii</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {result.timeline.map((event, index) => (
                  <div key={index} className="relative flex gap-4 pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
                      event.type === 'RECEPTION' ? 'bg-blue-500' :
                      event.type === 'PRODUCTION' ? 'bg-green-500' :
                      event.type === 'CURING' ? 'bg-purple-500' :
                      event.type === 'MATERIAL' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {dayjs.utc(event.date).local().format('DD.MM.YYYY HH:mm')}
                          </p>
                        </div>
                        <span className={`badge ${
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
                        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
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
          </div>

          {/* Materials Used */}
          {result.batch.materials && result.batch.materials.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Użyte surowce</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surowiec</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partia surowca</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dostawca</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.batch.materials.map((mat) => (
                      <tr key={mat.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{mat.rawMaterial?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{mat.quantity} {mat.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{mat.reception?.batchNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{mat.reception?.supplier?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !isSearching && (
        <div className="card text-center py-12">
          <QueueListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Wyszukaj partię</h3>
          <p className="text-gray-500 mt-2">
            Wprowadź numer partii produkcyjnej, aby zobaczyć pełną historię pochodzenia.
          </p>
        </div>
      )}
    </div>
  );
}

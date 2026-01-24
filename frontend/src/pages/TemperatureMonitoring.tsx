import { useState, useEffect } from 'react';
import { api, TemperaturePoint, TemperatureReading } from '../services/api';
import { BeakerIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';

export default function TemperatureMonitoring() {
  const [points, setPoints] = useState<TemperaturePoint[]>([]);
  const [readings, setReadings] = useState<TemperatureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showPointModal, setShowPointModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TemperaturePoint | null>(null);
  const [editingPoint, setEditingPoint] = useState<TemperaturePoint | null>(null);
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [trends, setTrends] = useState<any[]>([]);
  
  // Form state for point
  const [pointForm, setPointForm] = useState({
    name: '',
    location: '',
    type: 'COOLER' as 'COOLER' | 'FREEZER' | 'PRODUCTION' | 'TRANSPORT',
    minTemp: '',
    maxTemp: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pointsData, readingsData, trendsData] = await Promise.all([
        api.getTemperaturePoints(),
        api.getTemperatureReadings({ limit: 50 }),
        api.getTemperatureTrends({ days: 7 }),
      ]);
      setPoints(pointsData);
      setReadings(readingsData);
      setTrends(trendsData);
    } catch (error) {
      toast.error('Błąd wczytywania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoint) return;

    try {
      await api.createTemperatureReading({
        temperaturePointId: selectedPoint.id,
        temperature: parseFloat(temperature),
        notes: notes || undefined,
      });
      toast.success('Pomiar zapisany');
      setShowReadingModal(false);
      setTemperature('');
      setNotes('');
      setSelectedPoint(null);
      loadData();
    } catch (error) {
      toast.error('Błąd zapisywania pomiaru');
    }
  };

  const handleSavePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: pointForm.name,
        location: pointForm.location,
        type: pointForm.type,
        minTemp: parseFloat(pointForm.minTemp),
        maxTemp: parseFloat(pointForm.maxTemp),
      };

      if (editingPoint) {
        await api.updateTemperaturePoint(editingPoint.id, data);
        toast.success('Punkt zaktualizowany');
      } else {
        await api.createTemperaturePoint(data);
        toast.success('Punkt dodany');
      }
      
      setShowPointModal(false);
      resetPointForm();
      loadData();
    } catch (error) {
      toast.error('Błąd zapisywania punktu');
    }
  };

  const handleDeletePoint = async (point: TemperaturePoint) => {
    if (!confirm(`Czy na pewno chcesz usunąć "${point.name}"? Wszystkie powiązane pomiary zostaną zachowane.`)) {
      return;
    }
    try {
      await api.deleteTemperaturePoint(point.id);
      toast.success('Punkt usunięty');
      loadData();
    } catch (error) {
      toast.error('Błąd usuwania punktu');
    }
  };

  const openAddPoint = () => {
    setEditingPoint(null);
    resetPointForm();
    setShowPointModal(true);
  };

  const openEditPoint = (point: TemperaturePoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPoint(point);
    setPointForm({
      name: point.name,
      location: point.location,
      type: point.type as 'COOLER' | 'FREEZER' | 'PRODUCTION' | 'TRANSPORT',
      minTemp: point.minTemp.toString(),
      maxTemp: point.maxTemp.toString(),
    });
    setShowPointModal(true);
  };

  const resetPointForm = () => {
    setPointForm({
      name: '',
      location: '',
      type: 'COOLER',
      minTemp: '0',
      maxTemp: '4',
    });
    setEditingPoint(null);
  };

  const openAddReading = (point: TemperaturePoint, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPoint(point);
    setShowReadingModal(true);
  };

  const chartData = trends.length > 0 ? {
    labels: trends[0]?.readings?.map((r: any) => dayjs(r.readAt).format('DD.MM HH:mm')) || [],
    datasets: trends.map((trend, index) => ({
      label: trend.pointName,
      data: trend.readings.map((r: any) => r.temperature),
      borderColor: `hsl(${index * 60}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
      tension: 0.3,
    })),
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-meat-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring temperatury</h1>
          <p className="text-gray-500 mt-1">Kontrola temperatury w punktach krytycznych</p>
        </div>
        <button onClick={openAddPoint} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Dodaj pomieszczenie
        </button>
      </div>

      {/* Temperature Points Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {points.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <BeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak punktów pomiarowych</h3>
            <p className="text-gray-500 mb-4">Dodaj pierwszą chłodnię lub mroźnię do monitorowania</p>
            <button onClick={openAddPoint} className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2 inline" />
              Dodaj pomieszczenie
            </button>
          </div>
        ) : (
          points.map((point) => {
            const lastReading = readings.find(r => r.temperaturePointId === point.id);
            return (
              <div
                key={point.id}
                className={`card relative group ${
                  lastReading && !lastReading.isCompliant ? 'ring-2 ring-red-500' : ''
                }`}
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditPoint(point, e)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edytuj"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePoint(point); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Usuń"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <BeakerIcon className={`w-8 h-8 ${
                    point.type === 'FREEZER' ? 'text-blue-500' : 
                    point.type === 'PRODUCTION' ? 'text-orange-500' :
                    point.type === 'TRANSPORT' ? 'text-purple-500' : 'text-green-500'
                  }`} />
                  <span className={`badge ${
                    point.type === 'FREEZER' ? 'badge-info' : 
                    point.type === 'PRODUCTION' ? 'badge-warning' :
                    point.type === 'TRANSPORT' ? 'bg-purple-100 text-purple-800' : 'badge-success'
                  }`}>
                    {point.type === 'FREEZER' ? 'Mroźnia' : 
                     point.type === 'PRODUCTION' ? 'Produkcja' :
                     point.type === 'TRANSPORT' ? 'Transport' : 'Chłodnia'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{point.name}</h3>
                <p className="text-sm text-gray-500">{point.location}</p>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">Limity: {point.minTemp}°C do {point.maxTemp}°C</p>
                  {lastReading ? (
                    <div className="mt-2">
                      <p className={`text-2xl font-bold ${
                        lastReading.isCompliant ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {lastReading.temperature}°C
                      </p>
                      <p className="text-xs text-gray-400">
                        {dayjs(lastReading.readAt).format('DD.MM.YYYY HH:mm')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">Brak pomiarów</p>
                  )}
                </div>
                
                {/* Add reading button */}
                <button
                  onClick={(e) => openAddReading(point, e)}
                  className="mt-4 w-full btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Dodaj pomiar
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Chart */}
      {chartData && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trend temperatury (7 dni)</h2>
          <div className="h-64">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { title: { display: true, text: '°C' } } },
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Readings Table */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ostatnie pomiary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punkt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temperatura</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {readings.slice(0, 20).map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {dayjs(reading.readAt).format('DD.MM.YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {reading.temperaturePoint?.name}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {reading.temperature}°C
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${reading.isCompliant ? 'badge-success' : 'badge-danger'}`}>
                      {reading.isCompliant ? 'OK' : 'Niezgodny'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {reading.user?.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reading Modal */}
      {showReadingModal && selectedPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dodaj pomiar - {selectedPoint.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Limity: {selectedPoint.minTemp}°C do {selectedPoint.maxTemp}°C
              </p>
              <form onSubmit={handleAddReading} className="space-y-4">
                <div>
                  <label className="label">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="-18.5"
                    required
                  />
                </div>
                <div>
                  <label className="label">Uwagi (opcjonalnie)</label>
                  <textarea
                    className="input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReadingModal(false);
                      setSelectedPoint(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Zapisz pomiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Point Modal */}
      {showPointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPoint ? 'Edytuj pomieszczenie' : 'Dodaj pomieszczenie'}
              </h2>
              <form onSubmit={handleSavePoint} className="space-y-4">
                <div>
                  <label className="label">Nazwa</label>
                  <input
                    type="text"
                    className="input"
                    value={pointForm.name}
                    onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })}
                    placeholder="np. Chłodnia nr 4"
                    required
                  />
                </div>
                <div>
                  <label className="label">Lokalizacja</label>
                  <input
                    type="text"
                    className="input"
                    value={pointForm.location}
                    onChange={(e) => setPointForm({ ...pointForm, location: e.target.value })}
                    placeholder="np. Hala produkcyjna - sekcja B"
                    required
                  />
                </div>
                <div>
                  <label className="label">Typ</label>
                  <select
                    className="input"
                    value={pointForm.type}
                    onChange={(e) => {
                      const type = e.target.value as typeof pointForm.type;
                      let minTemp = '0', maxTemp = '4';
                      if (type === 'FREEZER') {
                        minTemp = '-22'; maxTemp = '-18';
                      } else if (type === 'PRODUCTION') {
                        minTemp = '10'; maxTemp = '18';
                      } else if (type === 'TRANSPORT') {
                        minTemp = '0'; maxTemp = '7';
                      }
                      setPointForm({ ...pointForm, type, minTemp, maxTemp });
                    }}
                  >
                    <option value="COOLER">Chłodnia (0-4°C)</option>
                    <option value="FREEZER">Mroźnia (-22 do -18°C)</option>
                    <option value="PRODUCTION">Hala produkcyjna (10-18°C)</option>
                    <option value="TRANSPORT">Transport (0-7°C)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Min. temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={pointForm.minTemp}
                      onChange={(e) => setPointForm({ ...pointForm, minTemp: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Max. temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={pointForm.maxTemp}
                      onChange={(e) => setPointForm({ ...pointForm, maxTemp: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPointModal(false);
                      resetPointForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingPoint ? 'Zapisz zmiany' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

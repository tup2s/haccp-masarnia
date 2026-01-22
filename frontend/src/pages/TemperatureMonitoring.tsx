import { useState, useEffect } from 'react';
import { api, TemperaturePoint, TemperatureReading } from '../services/api';
import { PlusIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';

export default function TemperatureMonitoring() {
  const [points, setPoints] = useState<TemperaturePoint[]>([]);
  const [readings, setReadings] = useState<TemperatureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TemperaturePoint | null>(null);
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [trends, setTrends] = useState<any[]>([]);

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
      setShowModal(false);
      setTemperature('');
      setNotes('');
      setSelectedPoint(null);
      loadData();
    } catch (error) {
      toast.error('Błąd zapisywania pomiaru');
    }
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
      </div>

      {/* Temperature Points Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {points.map((point) => {
          const lastReading = readings.find(r => r.temperaturePointId === point.id);
          return (
            <div
              key={point.id}
              className={`card cursor-pointer hover:shadow-lg transition-shadow ${
                lastReading && !lastReading.isCompliant ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => {
                setSelectedPoint(point);
                setShowModal(true);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <BeakerIcon className={`w-8 h-8 ${
                  point.type === 'FREEZER' ? 'text-blue-500' : 'text-green-500'
                }`} />
                <span className={`badge ${
                  point.type === 'FREEZER' ? 'badge-info' : 'badge-success'
                }`}>
                  {point.type === 'FREEZER' ? 'Mroźnia' : 'Chłodnia'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{point.name}</h3>
              <p className="text-sm text-gray-500">{point.location}</p>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">Limity: {point.minTemp}°C do {point.maxTemp}°C</p>
                {lastReading && (
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
                )}
              </div>
            </div>
          );
        })}
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
      {showModal && selectedPoint && (
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
                      setShowModal(false);
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardStats, Alert } from '../services/api';
import {
  CubeIcon,
  TruckIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, alertsData, chartDataResponse] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardAlerts(),
        api.getDashboardChart(7),
      ]);
      setStats(statsData);
      setAlerts(alertsData);

      // Format chart data
      if (Object.keys(chartDataResponse).length > 0) {
        const labels = [...new Set(
          Object.values(chartDataResponse).flatMap((point: any) => 
            point.map((d: any) => d.date)
          )
        )].sort();

        const datasets = Object.entries(chartDataResponse).map(([name, data]: [string, any], index) => ({
          label: name,
          data: labels.map(date => {
            const point = data.find((d: any) => d.date === date);
            return point ? point.avgTemp : null;
          }),
          borderColor: `hsl(${index * 60}, 70%, 50%)`,
          backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
          tension: 0.3,
        }));

        setChartData({
          labels: labels.map(d => dayjs(d).format('DD.MM')),
          datasets,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { name: 'Aktywne produkty', value: stats?.totalProducts || 0, icon: CubeIcon, color: 'bg-blue-500' },
    { name: 'Zatwierdzeni dostawcy', value: stats?.activeSuppliers || 0, icon: TruckIcon, color: 'bg-green-500' },
    { name: 'Pomiary dziś', value: stats?.todayReadings || 0, icon: BeakerIcon, color: 'bg-purple-500' },
    { name: 'Niezgodności (7 dni)', value: stats?.nonCompliantReadings || 0, icon: ExclamationTriangleIcon, color: 'bg-red-500' },
    { name: 'Otwarte korekty', value: stats?.pendingActions || 0, icon: ArrowTrendingUpIcon, color: 'bg-orange-500' },
    { name: 'Aktywne listy audytu', value: stats?.upcomingAudits || 0, icon: ClipboardDocumentCheckIcon, color: 'bg-teal-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-meat-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Przegląd systemu HACCP</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trend temperatury (7 dni)</h2>
          {chartData ? (
            <div className="h-64">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                  },
                  scales: {
                    y: {
                      title: { display: true, text: '°C' },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Brak danych do wyświetlenia
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerty</h2>
          {alerts.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {dayjs.utc(alert.createdAt).local().format('DD.MM.YYYY HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Brak aktywnych alertów
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Szybkie akcje</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/temperatura" className="p-4 rounded-lg border border-gray-200 hover:border-meat-500 hover:bg-meat-50 transition-colors">
            <BeakerIcon className="w-8 h-8 text-meat-600 mb-2" />
            <p className="font-medium text-gray-900">Zapisz temperaturę</p>
            <p className="text-sm text-gray-500">Dodaj nowy pomiar</p>
          </Link>
          <Link to="/przyjecia" className="p-4 rounded-lg border border-gray-200 hover:border-meat-500 hover:bg-meat-50 transition-colors">
            <TruckIcon className="w-8 h-8 text-meat-600 mb-2" />
            <p className="font-medium text-gray-900">Przyjęcie surowca</p>
            <p className="text-sm text-gray-500">Zarejestruj dostawę</p>
          </Link>
          <Link to="/produkcja" className="p-4 rounded-lg border border-gray-200 hover:border-meat-500 hover:bg-meat-50 transition-colors">
            <CubeIcon className="w-8 h-8 text-meat-600 mb-2" />
            <p className="font-medium text-gray-900">Nowa partia</p>
            <p className="text-sm text-gray-500">Rozpocznij produkcję</p>
          </Link>
          <Link to="/raporty" className="p-4 rounded-lg border border-gray-200 hover:border-meat-500 hover:bg-meat-50 transition-colors">
            <ClipboardDocumentCheckIcon className="w-8 h-8 text-meat-600 mb-2" />
            <p className="font-medium text-gray-900">Generuj raport</p>
            <p className="text-sm text-gray-500">Dokumentacja PDF</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

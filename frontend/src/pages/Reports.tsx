import { useState } from 'react';
import { api } from '../services/api';
import { DocumentArrowDownIcon, ChartBarIcon, QueueListIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [temperatureForm, setTemperatureForm] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [traceabilityForm, setTraceabilityForm] = useState({
    batchNumber: '',
  });

  const downloadPdf = async (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateTemperatureReport = async () => {
    setIsGenerating('temperature');
    try {
      const blob = await api.getTemperatureReport(temperatureForm.startDate, temperatureForm.endDate);
      const filename = `raport-temperatury-${temperatureForm.startDate}-${temperatureForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateTraceabilityReport = async () => {
    if (!traceabilityForm.batchNumber.trim()) {
      toast.error('Podaj numer partii');
      return;
    }
    setIsGenerating('traceability');
    try {
      const blob = await api.getTraceabilityReport(traceabilityForm.batchNumber.trim());
      const filename = `traceability-${traceabilityForm.batchNumber}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateHACCPReport = async () => {
    setIsGenerating('haccp');
    try {
      const blob = await api.getHACCPReport();
      const filename = `plan-haccp-${dayjs().format('YYYY-MM-DD')}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporty</h1>
        <p className="text-gray-500 mt-1">Generowanie raportów PDF do dokumentacji HACCP</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temperature Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport temperatur</h3>
              <p className="text-sm text-gray-500">Zestawienie pomiarów temperatury</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data od</label>
              <input
                type="date"
                className="input"
                value={temperatureForm.startDate}
                onChange={(e) => setTemperatureForm({ ...temperatureForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data do</label>
              <input
                type="date"
                className="input"
                value={temperatureForm.endDate}
                onChange={(e) => setTemperatureForm({ ...temperatureForm, endDate: e.target.value })}
              />
            </div>
            <button
              onClick={generateTemperatureReport}
              disabled={isGenerating === 'temperature'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'temperature' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Traceability Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <QueueListIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport traceability</h3>
              <p className="text-sm text-gray-500">Śledzenie partii produkcyjnej</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Numer partii</label>
              <input
                type="text"
                className="input"
                placeholder="np. 20240121-001"
                value={traceabilityForm.batchNumber}
                onChange={(e) => setTraceabilityForm({ batchNumber: e.target.value })}
              />
            </div>
            <button
              onClick={generateTraceabilityReport}
              disabled={isGenerating === 'traceability'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'traceability' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* HACCP Plan Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-meat-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-meat-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Plan HACCP</h3>
              <p className="text-sm text-gray-500">Kompletny plan z CCP i zagrożeniami</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Generuje kompletny dokument Planu HACCP zawierający wszystkie Krytyczne Punkty Kontrolne 
              oraz analizę zagrożeń.
            </p>
            <button
              onClick={generateHACCPReport}
              disabled={isGenerating === 'haccp'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'haccp' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <div className="text-blue-600">ℹ️</div>
          <div>
            <h4 className="font-medium text-blue-900">Informacja o raportach</h4>
            <p className="text-sm text-blue-700 mt-1">
              Raporty są generowane w formacie PDF i mogą być używane jako dokumentacja 
              podczas kontroli weterynaryjnych oraz audytów HACCP. Przechowuj je zgodnie 
              z wymaganiami dokumentacji MLO (minimum 2 lata).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

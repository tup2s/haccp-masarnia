import { useState, useEffect } from 'react';
import { api, CleaningArea } from '../services/api';
import { DocumentArrowDownIcon, ChartBarIcon, QueueListIcon, ShieldCheckIcon, CubeIcon, SparklesIcon, BugAntIcon, BeakerIcon, ClipboardDocumentCheckIcon, AcademicCapIcon, DocumentTextIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

interface FormTemplate {
  id: string;
  name: string;
  code: string;
  description: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'templates' | 'reports'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [cleaningAreas, setCleaningAreas] = useState<CleaningArea[]>([]);
  const [temperatureForm, setTemperatureForm] = useState({
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [productionForm, setProductionForm] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [cleaningForm, setCleaningForm] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    areaId: '',
  });
  const [pestControlForm, setPestControlForm] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [curingForm, setCuringForm] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [auditsForm, setAuditsForm] = useState({
    startDate: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [trainingsForm, setTrainingsForm] = useState({
    startDate: dayjs().subtract(365, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });
  const [traceabilityForm, setTraceabilityForm] = useState({
    batchNumber: '',
  });

  useEffect(() => {
    api.getCleaningAreas().then(setCleaningAreas).catch(() => {});
    api.getFormTemplates().then(setTemplates).catch(() => {});
  }, []);

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
      const blob = await api.generateTemperatureReport(temperatureForm.startDate, temperatureForm.endDate);
      const filename = `raport-temperatury-${temperatureForm.startDate}-${temperatureForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateProductionReport = async () => {
    setIsGenerating('production');
    try {
      const blob = await api.generateProductionReport(productionForm.startDate, productionForm.endDate);
      const filename = `raport-produkcji-${productionForm.startDate}-${productionForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateCleaningReport = async () => {
    setIsGenerating('cleaning');
    try {
      const blob = await api.generateCleaningReport(
        cleaningForm.startDate, 
        cleaningForm.endDate,
        cleaningForm.areaId ? parseInt(cleaningForm.areaId) : undefined
      );
      const filename = `raport-mycia-${cleaningForm.startDate}-${cleaningForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generatePestControlReport = async () => {
    setIsGenerating('pestControl');
    try {
      const blob = await api.generatePestControlReport(pestControlForm.startDate, pestControlForm.endDate);
      const filename = `raport-ddd-${pestControlForm.startDate}-${pestControlForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateCuringReport = async () => {
    setIsGenerating('curing');
    try {
      const blob = await api.generateCuringReport(curingForm.startDate, curingForm.endDate);
      const filename = `raport-peklowania-${curingForm.startDate}-${curingForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateAuditsReport = async () => {
    setIsGenerating('audits');
    try {
      const blob = await api.generateAuditsReport(auditsForm.startDate, auditsForm.endDate);
      const filename = `raport-audytow-${auditsForm.startDate}-${auditsForm.endDate}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateTrainingsReport = async () => {
    setIsGenerating('trainings');
    try {
      const blob = await api.generateTrainingsReport(trainingsForm.startDate, trainingsForm.endDate);
      const filename = `raport-szkolen-${trainingsForm.startDate}-${trainingsForm.endDate}.pdf`;
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
      const blob = await api.generateTraceabilityReport(traceabilityForm.batchNumber.trim());
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
      const blob = await api.generateHACCPReport();
      const filename = `plan-haccp-${dayjs().format('YYYY-MM-DD')}.pdf`;
      downloadPdf(blob, filename);
      toast.success('Raport wygenerowany');
    } catch (error) {
      toast.error('Błąd podczas generowania raportu');
    } finally {
      setIsGenerating(null);
    }
  };

  // Otwórz wzorzec formularza w nowym oknie
  const openTemplate = (templateId: string, params?: Record<string, string>) => {
    const url = api.getFormTemplateUrl(templateId, params);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporty i Formularze</h1>
        <p className="text-gray-500 mt-1">Wzorce formularzy do druku i raporty z danymi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-meat-600 text-meat-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DocumentTextIcon className="w-5 h-5 inline-block mr-2" />
          Wzorce formularzy (puste)
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-meat-600 text-meat-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
          Raporty z danymi (PDF)
        </button>
      </div>

      {/* TAB: Wzorce formularzy */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex gap-3">
              <div className="text-yellow-600">📋</div>
              <div>
                <h4 className="font-medium text-yellow-900">Puste formularze do ręcznego wypełnienia</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Wydrukuj puste formularze i wypełnij ręcznie długopisem. 
                  Idealne jako backup gdy system niedostępny lub do dokumentacji papierowej wymaganej przez PIW.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500 mb-1">{template.code}</p>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openTemplate(template.id)}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <PrinterIcon className="w-4 h-4" />
                    Otwórz i drukuj
                  </button>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Ładowanie wzorców formularzy...
            </div>
          )}

          {/* Quick print section */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">⚡ Szybki wydruk na tydzień</h3>
            <p className="text-sm text-gray-600 mb-4">
              Wydrukuj wszystkie formularze potrzebne na bieżący tydzień:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openTemplate('temperature-weekly', { week: dayjs().startOf('week').format('YYYY-MM-DD') })}
                className="btn-secondary text-sm"
              >
                🌡️ Temperatura (tydzień)
              </button>
              <button
                onClick={() => openTemplate('reception-daily', { date: dayjs().format('YYYY-MM-DD') })}
                className="btn-secondary text-sm"
              >
                🥩 Przyjęcia (dziś)
              </button>
              <button
                onClick={() => openTemplate('cleaning-daily', { date: dayjs().format('YYYY-MM-DD') })}
                className="btn-secondary text-sm"
              >
                🧹 Mycie (dziś)
              </button>
              <button
                onClick={() => openTemplate('production-daily', { date: dayjs().format('YYYY-MM-DD') })}
                className="btn-secondary text-sm"
              >
                🏭 Produkcja (dziś)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Raporty z danymi */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="card bg-blue-50 border border-blue-200">
            <div className="flex gap-3">
              <div className="text-blue-600">📊</div>
              <div>
                <h4 className="font-medium text-blue-900">Raporty wypełnione danymi z systemu</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Generuj raporty PDF z danymi wprowadzonymi do systemu. 
                  Do wydruku, podpisu i archiwizacji w dokumentacji HACCP.
                </p>
              </div>
            </div>
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

        {/* Production Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CubeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport produkcji</h3>
              <p className="text-sm text-gray-500">Zestawienie partii produkcyjnych</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data od</label>
              <input
                type="date"
                className="input"
                value={productionForm.startDate}
                onChange={(e) => setProductionForm({ ...productionForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data do</label>
              <input
                type="date"
                className="input"
                value={productionForm.endDate}
                onChange={(e) => setProductionForm({ ...productionForm, endDate: e.target.value })}
              />
            </div>
            <button
              onClick={generateProductionReport}
              disabled={isGenerating === 'production'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'production' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Cleaning Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport mycia</h3>
              <p className="text-sm text-gray-500">Mycie i dezynfekcja</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Strefa (opcjonalnie)</label>
              <select
                className="input"
                value={cleaningForm.areaId}
                onChange={(e) => setCleaningForm({ ...cleaningForm, areaId: e.target.value })}
              >
                <option value="">Wszystkie strefy</option>
                {cleaningAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Od</label>
                <input
                  type="date"
                  className="input"
                  value={cleaningForm.startDate}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Do</label>
                <input
                  type="date"
                  className="input"
                  value={cleaningForm.endDate}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={generateCleaningReport}
              disabled={isGenerating === 'cleaning'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'cleaning' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Pest Control Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BugAntIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport DDD</h3>
              <p className="text-sm text-gray-500">Kontrola szkodników</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Od</label>
                <input
                  type="date"
                  className="input"
                  value={pestControlForm.startDate}
                  onChange={(e) => setPestControlForm({ ...pestControlForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Do</label>
                <input
                  type="date"
                  className="input"
                  value={pestControlForm.endDate}
                  onChange={(e) => setPestControlForm({ ...pestControlForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={generatePestControlReport}
              disabled={isGenerating === 'pestControl'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'pestControl' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Curing Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <BeakerIcon className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport peklowania</h3>
              <p className="text-sm text-gray-500">Partie peklowane</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Od</label>
                <input
                  type="date"
                  className="input"
                  value={curingForm.startDate}
                  onChange={(e) => setCuringForm({ ...curingForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Do</label>
                <input
                  type="date"
                  className="input"
                  value={curingForm.endDate}
                  onChange={(e) => setCuringForm({ ...curingForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={generateCuringReport}
              disabled={isGenerating === 'curing'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'curing' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Audits Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport audytów</h3>
              <p className="text-sm text-gray-500">Wyniki audytów wewnętrznych</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Od</label>
                <input
                  type="date"
                  className="input"
                  value={auditsForm.startDate}
                  onChange={(e) => setAuditsForm({ ...auditsForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Do</label>
                <input
                  type="date"
                  className="input"
                  value={auditsForm.endDate}
                  onChange={(e) => setAuditsForm({ ...auditsForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={generateAuditsReport}
              disabled={isGenerating === 'audits'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'audits' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>

        {/* Trainings Report */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Raport szkoleń</h3>
              <p className="text-sm text-gray-500">Ewidencja szkoleń i uczestników</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Od</label>
                <input
                  type="date"
                  className="input"
                  value={trainingsForm.startDate}
                  onChange={(e) => setTrainingsForm({ ...trainingsForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Do</label>
                <input
                  type="date"
                  className="input"
                  value={trainingsForm.endDate}
                  onChange={(e) => setTrainingsForm({ ...trainingsForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <button
              onClick={generateTrainingsReport}
              disabled={isGenerating === 'trainings'}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGenerating === 'trainings' ? 'Generowanie...' : 'Pobierz PDF'}
            </button>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

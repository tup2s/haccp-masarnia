import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemperatureMonitoring from './pages/TemperatureMonitoring';
import Traceability from './pages/Traceability';
import Suppliers from './pages/Suppliers';
import RawMaterials from './pages/RawMaterials';
import Receptions from './pages/Receptions';
import Products from './pages/Products';
import Production from './pages/Production';
import Curing from './pages/Curing';
import Cleaning from './pages/Cleaning';
import PestControl from './pages/PestControl';
import Trainings from './pages/Trainings';
import CorrectiveActions from './pages/CorrectiveActions';
import Audits from './pages/Audits';
import Documents from './pages/Documents';
import HACCPPlan from './pages/HACCPPlan';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Materials from './pages/Materials';
import Butchering from './pages/Butchering';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-meat-600 border-t-transparent"></div>
      </div>
    );
  }
  
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/temperatura" element={<TemperatureMonitoring />} />
                <Route path="/traceability" element={<Traceability />} />
                <Route path="/dostawcy" element={<Suppliers />} />
                <Route path="/surowce" element={<RawMaterials />} />
                <Route path="/przyjecia" element={<Receptions />} />
                <Route path="/materialy" element={<Materials />} />
                <Route path="/rozbior" element={<Butchering />} />
                <Route path="/produkty" element={<Products />} />
                <Route path="/produkcja" element={<Production />} />
                <Route path="/peklowanie" element={<Curing />} />
                <Route path="/mycie" element={<Cleaning />} />
                <Route path="/ddd" element={<PestControl />} />
                <Route path="/szkolenia" element={<Trainings />} />
                <Route path="/korekty" element={<CorrectiveActions />} />
                <Route path="/audyty" element={<Audits />} />
                <Route path="/dokumenty" element={<Documents />} />
                <Route path="/haccp" element={<HACCPPlan />} />
                <Route path="/raporty" element={<Reports />} />
                <Route path="/uzytkownicy" element={<Users />} />
                <Route path="/ustawienia" element={<Settings />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

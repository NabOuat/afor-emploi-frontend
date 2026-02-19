import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AforDashboard from './pages/afor/AforDashboard';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import ResponsibleDashboard from './pages/responsible/ResponsibleDashboard';
import AforSettingsPage from './pages/afor/SettingsPage';
import OperatorSettingsPage from './pages/operator/SettingsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ActorsManagement from './pages/admin/ActorsManagement';
import ProjectsManagement from './pages/admin/ProjectsManagement';
import EmployeesPage from './pages/EmployeesPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><RoleBasedRoute><DashboardPage /></RoleBasedRoute></ProtectedRoute>} />
            <Route path="/afor/dashboard" element={<ProtectedRoute><AforDashboard /></ProtectedRoute>} />
            <Route path="/afor/settings" element={<ProtectedRoute><AforSettingsPage /></ProtectedRoute>} />
            <Route path="/operator/dashboard" element={<ProtectedRoute><OperatorDashboard /></ProtectedRoute>} />
            <Route path="/operator/settings" element={<ProtectedRoute><OperatorSettingsPage /></ProtectedRoute>} />
            <Route path="/responsable/dashboard" element={<ProtectedRoute><ResponsibleDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/actors" element={<ProtectedRoute><ActorsManagement /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute><ProjectsManagement /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

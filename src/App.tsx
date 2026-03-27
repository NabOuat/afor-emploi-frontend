import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import SidebarLayout from './components/SidebarLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AforDashboard from './pages/afor/AforDashboard';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import ResponsibleDashboard from './pages/responsible/ResponsibleDashboard';
import ResponsibleSettingsPage from './pages/responsible/SettingsPage';
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
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SidebarLayout>
                  <RoleBasedRoute><DashboardPage /></RoleBasedRoute>
                </SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/afor/dashboard" element={
              <ProtectedRoute>
                <SidebarLayout><AforDashboard /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/afor/settings" element={
              <ProtectedRoute>
                <SidebarLayout><AforSettingsPage /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/operator/dashboard" element={
              <ProtectedRoute>
                <SidebarLayout><OperatorDashboard /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/operator/settings" element={
              <ProtectedRoute>
                <SidebarLayout><OperatorSettingsPage /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/responsable/dashboard" element={
              <ProtectedRoute>
                <SidebarLayout><ResponsibleDashboard /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/responsable/settings" element={
              <ProtectedRoute>
                <SidebarLayout><ResponsibleSettingsPage /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <SidebarLayout><AdminDashboard /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/actors" element={
              <ProtectedRoute>
                <SidebarLayout><ActorsManagement /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute>
                <SidebarLayout><ProjectsManagement /></SidebarLayout>
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <SidebarLayout><EmployeesPage /></SidebarLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

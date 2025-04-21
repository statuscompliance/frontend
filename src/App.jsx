import { ThemeProvider } from '@/components/theme-provider';
import { HashRouter as Router, Routes, Route } from 'react-router';
import { Landing } from '@/pages/Landing';
import { About } from '@/pages/About';
import { Home } from '@/pages/app/Home';
import { Login } from '@/pages/Login';
import { Logout } from '@/pages/Logout';
import { Verify2FA } from '@/pages/Verify2FA';
import { Catalogs } from '@/pages/app/catalog/Catalogs';
import { CatalogDetails } from '@/pages/app/catalog/CatalogDetails';
import { ControlDetails } from '@/pages/app/ControlDetails';
import { ComputationDetails } from '@/pages/app/ComputationDetails';
import { CatalogWizard } from './pages/app/catalog/CatalogWizard.jsx';
import { Mashups } from '@/pages/app/Mashups';
import { Scopes } from '@/pages/app/Scopes';
import { Dashboards } from '@/pages/app/Dashboards';
import { DashboardDetails } from '@/pages/app/dashboard/DashboardDetails';
import { FolderDetails } from '@/pages/app/dashboard/FolderDetails';
import { Editor } from '@/pages/app/Editor';
import MainLayout from '@/layouts/MainLayout';
import AppLayout from '@/layouts/AppLayout';
import { AuthProvider, ProtectedRoute } from '@/components/auth-provider';

const allRolesAllowed = () => ['admin', 'user', 'developer'];

function App() {
  return (
    <ThemeProvider storageKey="vite-ui-theme">
      <Router>
        <AuthProvider>
          <Routes>
            {/* Doing nested routes allows to avoid re-rendering re-used components */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
            </Route>
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={allRolesAllowed()}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="catalogs">
                <Route index element={<Catalogs />} />
                <Route path="new" element={<CatalogWizard />} />
                <Route path=":id">
                  <Route index element={<CatalogDetails />} />
                  <Route path="controls/:controlId" element={<ControlDetails />} />
                  <Route path="controls/:controlId/computations/:computationId" element={<ComputationDetails />} />
                </Route>
              </Route>
              <Route path="dashboards">
                <Route index element={<Dashboards />} />
                <Route path=":id" element={<DashboardDetails />} />
                <Route path="folders/:id" element={<FolderDetails />} />
              </Route>
              <Route path="scopes" element={<Scopes />} />
              <Route path="mashups" element={<Mashups />} />
              <Route path="editor">
                <Route index element={<Editor />} />
                <Route path=":id" element={<Editor />} />
              </Route>
            </Route>
            { /* Routes here have no layout ON PURPOSE */ }
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={
              <ProtectedRoute allowedRoles={allRolesAllowed()}>
                <Logout />
              </ProtectedRoute>
            } />
            <Route path="/verify-2fa" element={<Verify2FA />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

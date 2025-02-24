import '@/styles/App.css';
import { ThemeProvider } from '@/components/theme-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { Landing } from '@/pages/Landing';
import { About } from '@/pages/About';
import { Home } from '@/pages/app/Home';
import { Login } from '@/pages/Login';
import { Logout } from '@/pages/Logout';
import { Verify2FA } from '@/pages/Verify2FA';
import { Catalogs } from '@/pages/app/Catalogs';
import MainLayout from '@/layouts/MainLayout';
import AppLayout from '@/layouts/AppLayout';
import { AuthProvider, ProtectedRoute } from '@/components/auth-provider';


function App() {
  return (
    <AuthProvider>
      <ThemeProvider storageKey="vite-ui-theme">
        <Router>
          <Routes>
            {/* Doing nested routes allows to avoid re-rendering re-used components */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Landing />} />
              <Route path="about" element={<About />} />
            </Route>
            <Route path="/app" element={
              // <ProtectedRoute>
              <AppLayout />
              // </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="catalogs" element={
                <Catalogs/>
              } />
            </Route>
            { /* Routes here have no layout ON PURPOSE */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/verify-2fa" element={<Verify2FA />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

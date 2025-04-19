import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TableDetailPage from './pages/TableDetailPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import { TimerProvider } from './contexts/TimerContext';
import { TableProvider } from './contexts/TableContext';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/UserContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Component to handle conditional rendering of landing page or home page
const HomePageWrapper = () => {
  const { user } = useUser();
  
  return user ? <HomePage /> : <LandingPage />;
};

function App() {
  return (
    <UserProvider>
      <TableProvider>
        <TimerProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePageWrapper />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                } />
                <Route path="/:tableId" element={
                  <ProtectedRoute>
                    <TableDetailPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </Router>
        </TimerProvider>
      </TableProvider>
    </UserProvider>
  );
}

export default App;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import CpuSessions from './pages/CpuSessions';
import Memory from './pages/Memory';
import Waits from './pages/Waits';
import Storage from './pages/Storage';
import TopSql from './pages/TopSql';
import Exadata from './pages/Exadata';
import Backups from './pages/Backups';
import Alerts from './pages/Alerts';
import Blocking from './pages/Blocking';
import { auth } from './services/api';

function Protected({ children }) {
  return auth.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/"         element={<Overview />} />
                <Route path="/cpu"      element={<CpuSessions />} />
                <Route path="/memory"   element={<Memory />} />
                <Route path="/waits"    element={<Waits />} />
                <Route path="/storage"  element={<Storage />} />
                <Route path="/sql"      element={<TopSql />} />
                <Route path="/exadata"  element={<Exadata />} />
                <Route path="/backups"  element={<Backups />} />
                <Route path="/alerts"   element={<Alerts />} />
                <Route path="/blocking" element={<Blocking />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Popover from './components/Popover';
import Dashboard from './components/Dashboard';
import FeedDetail from './components/FeedDetail';
import Settings from './components/Settings';
import About from './components/About';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.downnotice) {
      window.downnotice.onNavigate((route) => {
        navigate(`/${route}`);
      });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/popover" element={<Popover />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feed/:feedId" element={<FeedDetail />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

export default function App() {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    if (window.downnotice) {
      window.downnotice.getSettings().then(s => {
        setTheme(s.theme || 'system');
      });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

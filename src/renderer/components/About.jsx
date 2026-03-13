import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GPL2_TEXT } from '../constants/gpl2';

export default function About() {
  const navigate = useNavigate();
  const [appInfo, setAppInfo] = useState({
    name: 'DownNotice',
    version: '1.0.0',
    buildDate: 'March 12, 2026'
  });

  useEffect(() => {
    if (window.downnotice) {
      window.downnotice.getAppInfo().then(setAppInfo);
    }
  }, []);

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      <div className="about-container">
        <h1>{appInfo.name}</h1>
        <div className="version">Version {appInfo.version}</div>
        <div className="version">Build Date: {appInfo.buildDate}</div>

        <h3 style={{ marginBottom: 12, marginTop: 24 }}>GNU General Public License v2.0</h3>
        <div className="license-box">
          {GPL2_TEXT}
        </div>
      </div>
    </div>
  );
}

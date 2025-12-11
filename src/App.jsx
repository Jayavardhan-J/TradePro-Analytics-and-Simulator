import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MarketOverview from './pages/MarketOverview'; // Import the new page

// Placeholder
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-[50vh] text-gray-500">
    {title} - Coming Soon
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* New Home Page */}
          <Route path="/" element={<MarketOverview />} />
          
          {/* Your Sector Dashboard moved here */}
          <Route path="/sectors" element={<Dashboard />} />
          
          <Route path="/screeners" element={<ComingSoon title="Screeners" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
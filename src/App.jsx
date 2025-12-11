import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MarketOverview from './pages/MarketOverview';
import Dashboard from './pages/Dashboard';
import { LiveProvider } from './context/LiveContext'; // Import this

const App = () => {
  return (
    <LiveProvider> {/* Wrap everything here */}
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<MarketOverview />} />
            <Route path="/sectors" element={<Dashboard />} />
            <Route path="/screeners" element={<div className="p-10 text-gray-400">Screeners Coming Soon</div>} />
          </Routes>
        </Layout>
      </Router>
    </LiveProvider>
  );
};

export default App;
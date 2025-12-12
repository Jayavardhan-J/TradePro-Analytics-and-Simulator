import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MarketOverview from './pages/MarketOverview';
import Dashboard from './pages/Dashboard';
import OpenInterest from './pages/OpenInterest'; // Import New Page
import { LiveProvider } from './context/LiveContext';

const App = () => {
  return (
    <LiveProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<MarketOverview />} />
            <Route path="/sectors" element={<Dashboard />} />
            <Route path="/screeners" element={<OpenInterest />} />
          </Routes>
        </Layout>
      </Router>
    </LiveProvider>
  );
};

export default App;
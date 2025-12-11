import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { dashboardService } from '../services/api';
import SectorPerformance from '../components/dashboard/SectorPerformance';
import SectorConstituents from '../components/dashboard/SectorConstituents';
import { RefreshCw, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLive } from '../context/LiveContext';

const Dashboard = () => {
  const { isLive } = useLive();
  const [sectors, setSectors] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);
  const [hoveredSectorData, setHoveredSectorData] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false); // Track market status locally

  // --- Check Market Status Helper ---
  const checkMarketOpen = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // 09:13 (553) to 15:30 (930)
    return currentMinutes >= 553 && currentMinutes <= 930;
  };

  const fetchData = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const [sectorData, stockData] = await Promise.all([
        dashboardService.getSectorPerformance(),
        dashboardService.getSectorConstituents()
      ]);
      
      if (sectorData.success) {
        const sortedSectors = [...sectorData.data].sort((a, b) => b.changePer - a.changePer);
        setSectors(sortedSectors);
        if (!isPolling && sortedSectors.length > 0 && !selectedSector) {
          setSelectedSector(sortedSectors[0].indexName);
        }
      }
      if (stockData.success) setAllStocks(stockData.data);
    } catch (e) {
      console.error("Dashboard Load Error", e);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [selectedSector]);

  // Initial Fetch & Status Check
  useEffect(() => {
    fetchData(false);
    setIsMarketOpen(checkMarketOpen());
    
    // Update status check every minute
    const statusInterval = setInterval(() => setIsMarketOpen(checkMarketOpen()), 60000);
    return () => clearInterval(statusInterval);
  }, []);

  // Polling Logic
  useEffect(() => {
    let intervalId;
    if (isLive && checkMarketOpen()) {
      intervalId = setInterval(() => fetchData(true), 15000);
    }
    return () => clearInterval(intervalId);
  }, [isLive, fetchData]);

  const displaySectorData = useMemo(() => {
    if (hoveredSectorData) return hoveredSectorData;
    if (selectedSector) return sectors.find(s => s.indexName === selectedSector);
    return sectors[0];
  }, [hoveredSectorData, selectedSector, sectors]);

  const filteredStocks = useMemo(() => {
    if (!selectedSector || !allStocks.length) return [];
    return allStocks.filter(s => s.indexName === selectedSector).sort((a,b) => b.changePer - a.changePer);
  }, [allStocks, selectedSector]);

  if (loading) return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <span className="text-gray-500 text-sm font-mono">Initializing Market Stream...</span>
      </div>
    </div>
  );

  const isPositive = displaySectorData?.changePer >= 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time relative strength analysis</p>
        </div>
        
        {/* --- STATUS BADGE LOGIC UPDATED --- */}
        {isMarketOpen ? (
          // Market Open: Show Green if Live, Gray if Paused
          isLive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">LIVE FEED (15s)</span>
            </div>
          )
        ) : (
          // Market Closed: Force Solid Red
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span className="text-[10px] font-mono font-bold text-rose-400">MARKET CLOSED</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 bg-[#0f0f12] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="flex justify-between items-start mb-6 h-14">
            <div>
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>Sector Relative Strength
              </h2>
              <p className="text-xs text-gray-500 ml-3 mt-1">Sorted by % Change. Click bar to lock.</p>
            </div>
            {displaySectorData && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <h3 className="text-xl font-bold text-gray-200 tracking-tight">{displaySectorData.indexName}</h3>
                  <span className={`flex items-center text-sm font-bold font-mono px-2 py-1 rounded ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {isPositive ? '+' : ''}{displaySectorData.changePer}%
                    {isPositive ? <ArrowUpRight size={14} className="ml-1" /> : <ArrowDownRight size={14} className="ml-1" />}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3 mt-1 text-xs text-gray-500 font-mono">
                  <span>Net: <span className={isPositive ? 'text-emerald-500' : 'text-rose-500'}>{displaySectorData.change > 0 ? '+' : ''}{displaySectorData.change.toFixed(2)}</span></span>
                  <span className="flex items-center gap-1 text-indigo-400"><Activity size={10}/> {displaySectorData.symbolCode}</span>
                </div>
              </div>
            )}
          </div>
          <SectorPerformance data={sectors} selectedSector={selectedSector} onSectorClick={setSelectedSector} onSectorHover={setHoveredSectorData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-1">
          <SectorConstituents stocks={filteredStocks} sectorName={selectedSector || "Select a Sector"} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
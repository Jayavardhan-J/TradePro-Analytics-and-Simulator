import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { dashboardService } from '../services/api';
import SectorPerformance from '../components/dashboard/SectorPerformance';
import SectorConstituents from '../components/dashboard/SectorConstituents';
import { RefreshCw, Play, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [sectors, setSectors] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);
  const [hoveredSectorData, setHoveredSectorData] = useState(null); // Track hover state
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // --- Fetch Logic ---
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
      
      if (stockData.success) {
        setAllStocks(stockData.data);
      }
    } catch (e) {
      console.error("Dashboard Load Error", e);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [selectedSector]);

  useEffect(() => {
    fetchData(false);
  }, []);

  useEffect(() => {
    let intervalId;
    if (isAutoRefresh) {
      intervalId = setInterval(() => { fetchData(true); }, 10000);
    }
    return () => clearInterval(intervalId);
  }, [isAutoRefresh, fetchData]);

  // --- Derived State for HUD ---
  // If hovering, show that. If not, show selected. If neither, show first.
  const displaySectorData = useMemo(() => {
    if (hoveredSectorData) return hoveredSectorData;
    if (selectedSector) return sectors.find(s => s.indexName === selectedSector);
    return sectors[0];
  }, [hoveredSectorData, selectedSector, sectors]);

  const filteredStocks = useMemo(() => {
    if (!selectedSector || !allStocks.length) return [];
    return allStocks
      .filter(s => s.indexName === selectedSector)
      .sort((a,b) => b.changePer - a.changePer);
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
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Market Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time relative strength analysis</p>
        </div>
        
        <button 
          onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
            isAutoRefresh 
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-[#18181b] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
          }`}
        >
          {isAutoRefresh ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-medium text-sm">LIVE</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span className="font-medium text-sm">Auto Refresh</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 bg-[#0f0f12] border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          
          {/* --- HEADER + HUD ROW --- */}
          {/* This flex container ensures the title and the info are perfectly aligned */}
          <div className="flex justify-between items-start mb-6 h-14">
            <div>
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                Sector Relative Strength
              </h2>
              <p className="text-xs text-gray-500 ml-3 mt-1">Sorted by % Change. Click bar to lock.</p>
            </div>

            {/* DYNAMIC INFO HUD */}
            {displaySectorData && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-3">
                  <h3 className="text-xl font-bold text-gray-200 tracking-tight">
                    {displaySectorData.indexName}
                  </h3>
                  <span className={`flex items-center text-sm font-bold font-mono px-2 py-1 rounded ${
                    isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
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
          
          <SectorPerformance 
            data={sectors} 
            selectedSector={selectedSector}
            onSectorClick={setSelectedSector} 
            onSectorHover={setHoveredSectorData} // Pass hover handler
          />
        </motion.div>

        {/* Table Section */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="xl:col-span-1"
        >
          <SectorConstituents 
            stocks={filteredStocks} 
            sectorName={selectedSector || "Select a Sector"} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { Activity, BarChart2, Globe, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLive } from '../context/LiveContext';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" } 
  }
};

// --- 1. Market Breadth Component ---
const MarketBreadth = ({ data }) => {
  const advances = data?.advances || 0;
  const declines = data?.declines || 0;
  const total = advances + declines;
  const safeTotal = total === 0 ? 1 : total;
  const advPercent = (advances / safeTotal) * 100;
  
  const needleRotation = (advPercent * 1.8) - 90;
  const ratio = advances / (declines || 1);

  return (
    <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-6 h-full flex flex-col justify-between">
      {/* Top: Bar Chart */}
      <div>
        <h3 className="text-gray-100 font-semibold flex items-center gap-2 mb-6">
          <Activity size={18} className="text-indigo-500" />
          Market Breadth
        </h3>
        
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{advances} Advances
          </span>
          <span className="text-rose-400 font-bold flex items-center gap-2">
            {declines} Declines<span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </span>
        </div>
        
        <div className="h-6 w-full bg-gray-800/50 rounded-full overflow-hidden flex relative">
          <div style={{ width: `${advPercent}%` }} className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-500"></div>
          <div style={{ width: `${100 - advPercent}%` }} className="h-full bg-gradient-to-l from-rose-600 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all duration-500"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/50 z-10 transform -translate-x-1/2"></div>
        </div>
      </div>

      {/* Middle: Sentiment Meter */}
      <div className="flex flex-col items-center justify-center py-4 my-2 relative">
         <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Gauge size={14} /> Sentiment Meter
         </div>

        <div className="relative w-48 h-24 flex justify-center overflow-hidden mb-2">
           <div className="absolute inset-0 rounded-t-full bg-gradient-to-r from-rose-600 via-gray-500 to-emerald-600 opacity-20 mask-radial-gauge"></div>
           <div className="w-48 h-24 rounded-t-full border-[10px] border-gray-800 border-b-0 mask-radial-gauge box-border"></div>
           
           <div 
             className="absolute bottom-0 left-1/2 h-full w-0.5 origin-bottom transition-transform duration-700 ease-out z-20"
             style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
           >
              <div className="h-3/4 w-full bg-gray-200 rounded-t-full shadow-[0_-4px_10px_rgba(255,255,255,0.5)]"></div>
           </div>

           <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-200 rounded-full z-30 border-2 border-[#0f0f12]"></div>

           <span className="absolute bottom-1 left-2 text-[9px] font-bold text-rose-500 uppercase">Bearish</span>
           <span className="absolute bottom-1 right-2 text-[9px] font-bold text-emerald-500 uppercase">Bullish</span>
        </div>
        
        <div className="text-center mt-1">
           <span className="text-gray-500 text-xs font-mono">
            A/D Ratio: <span className={ratio > 1 ? "text-emerald-400" : "text-rose-400"}>{ratio.toFixed(2)}x</span>
          </span>
        </div>

        <style>{`
          .mask-radial-gauge {
            -webkit-mask-image: radial-gradient(circle at bottom center, transparent 55%, black 56%);
            mask-image: radial-gradient(circle at bottom center, transparent 55%, black 56%);
          }
        `}</style>
      </div>

      {/* Bottom: FII/DII Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-[#18181b] border border-gray-800 flex flex-col items-center justify-center hover:border-gray-700 transition-colors">
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">FII Cash</p>
          <p className="text-rose-400 font-bold text-base">-1,245 Cr</p>
        </div>
        <div className="p-3 rounded-xl bg-[#18181b] border border-gray-800 flex flex-col items-center justify-center hover:border-gray-700 transition-colors">
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">DII Cash</p>
          <p className="text-emerald-400 font-bold text-base">+890 Cr</p>
        </div>
      </div>
    </div>
  );
};

// --- 2. Top Movers Component ---
const TopMovers = ({ data }) => {
  const [activeTab, setActiveTab] = useState('gainers');
  
  const gainers = data
    .filter(item => item.changePer > 0)
    .sort((a, b) => b.changePer - a.changePer)
    .slice(0, 5);

  const losers = data
    .filter(item => item.changePer < 0)
    .sort((a, b) => a.changePer - b.changePer)
    .slice(0, 5);

  const displayData = activeTab === 'gainers' ? gainers : losers;

  return (
    <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-100 font-semibold flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-500" />
          Top Movers
        </h3>
        <div className="flex bg-[#18181b] p-1 rounded-lg border border-gray-800 relative">
          <motion.div 
            layoutId="activeTabPillMovers"
            className="absolute top-1 bottom-1 rounded bg-indigo-500/20"
            initial={false}
            animate={{ 
              x: activeTab === 'gainers' ? 0 : '100%', 
              width: '50%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button onClick={() => setActiveTab('gainers')} className={`relative z-10 px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'gainers' ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Gainers</button>
          <button onClick={() => setActiveTab('losers')} className={`relative z-10 px-3 py-1 text-xs font-medium rounded transition-colors ${activeTab === 'losers' ? 'text-rose-400' : 'text-gray-500 hover:text-gray-300'}`}>Losers</button>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-none relative">
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {displayData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group border border-transparent hover:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-600 w-4">{i + 1}</span>
                  <span className="text-sm font-bold text-gray-200 group-hover:text-white">{item.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{item.lastPrice.toLocaleString('en-IN')}</p>
                  <p className={`text-xs font-bold ${activeTab === 'gainers' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {activeTab === 'gainers' ? '+' : ''}{item.changePer.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- 3. Global Markets Component ---
const GlobalMarkets = () => {
  const [activeRegion, setActiveRegion] = useState('americas');

  const marketData = {
    americas: [
      { name: 'S&P 500', value: '5,200', chg: '+0.8%', isUp: true },
      { name: 'Nasdaq', value: '16,400', chg: '+1.2%', isUp: true },
      { name: 'Dow Jones', value: '39,100', chg: '+0.4%', isUp: true },
      { name: 'Russell 2000', value: '2,050', chg: '-0.2%', isUp: false },
    ],
    europe: [
      { name: 'DAX', value: '18,400', chg: '+0.5%', isUp: true },
      { name: 'FTSE 100', value: '7,950', chg: '-0.3%', isUp: false },
      { name: 'CAC 40', value: '7,900', chg: '-0.2%', isUp: false },
      { name: 'Euro Stoxx', value: '5,000', chg: '+0.6%', isUp: true },
    ],
    asia: [
      { name: 'Nikkei 225', value: '40,100', chg: '+0.5%', isUp: true },
      { name: 'Hang Seng', value: '16,500', chg: '+1.1%', isUp: true },
      { name: 'Shanghai', value: '3,050', chg: '-0.4%', isUp: false },
      { name: 'KOSPI', value: '2,750', chg: '+0.9%', isUp: true },
    ]
  };

  const currentData = marketData[activeRegion];

  return (
    <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-100 font-semibold flex items-center gap-2">
          <Globe size={18} className="text-indigo-500" />
          Global Markets
        </h3>
        
        {/* Region Tabs */}
        <div className="flex bg-[#18181b] p-1 rounded-lg border border-gray-800">
          <button onClick={() => setActiveRegion('americas')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeRegion === 'americas' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>US</button>
          <button onClick={() => setActiveRegion('europe')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeRegion === 'europe' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>EU</button>
          <button onClick={() => setActiveRegion('asia')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${activeRegion === 'asia' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>Asia</button>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-none relative">
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeRegion}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {currentData.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group border border-transparent hover:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 rounded-full ${m.isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <span className="text-sm font-bold text-gray-200 group-hover:text-white">{m.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{m.value}</p>
                  <p className={`text-xs font-bold ${m.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.chg}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const MarketOverview = () => {
  const { isLive } = useLive();
  const [moversData, setMoversData] = useState([]); 
  const [breadthData, setBreadthData] = useState({ advances: 0, declines: 0 });

  // Helper to check market hours (kept logic, removed UI)
  const checkMarketOpen = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // 9:13 AM (553m) to 3:30 PM (930m)
    return currentMinutes >= 553 && currentMinutes <= 930;
  };

  const fetchAllData = async () => {
    try {
      const [moversRes, breadthRes] = await Promise.all([
        dashboardService.getTopMovers(),
        dashboardService.getMarketBreadth()
      ]);
      if (moversRes.success && moversRes.data) setMoversData(moversRes.data);
      if (breadthRes.success && breadthRes.data) setBreadthData(breadthRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Polling Logic (Respects Live Toggle & Time)
  useEffect(() => {
    let intervalId;
    if (isLive && checkMarketOpen()) {
      intervalId = setInterval(() => { fetchAllData(); }, 15000);
    }
    return () => clearInterval(intervalId);
  }, [isLive]);

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 max-w-7xl mx-auto pb-10">
      <motion.div variants={itemVariants} className="mb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Market Pulse</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time market breadth and global signals</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">
        <div className="lg:col-span-1 h-full"><MarketBreadth data={breadthData} /></div>
        <div className="lg:col-span-1 h-full"><TopMovers data={moversData} /></div>
        <div className="lg:col-span-1 h-full"><GlobalMarkets /></div>
      </motion.div>
    </motion.div>
  );
};

export default MarketOverview;
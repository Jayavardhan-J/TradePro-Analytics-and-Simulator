import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Activity, Settings, Bell, TrendingUp, TrendingDown, Radio } from 'lucide-react';
import { dashboardService } from '../services/api';
import { useLive } from '../context/LiveContext';

// --- Compact Ticker Item ---
const HeaderTickerItem = ({ name, value, change, changePer }) => {
  const isPositive = change >= 0;
  return (
    <div className="flex-shrink-0 flex flex-col justify-center px-5 py-2 bg-[#18181b] border border-gray-800 rounded-xl min-w-[240px] relative overflow-hidden group/item hover:border-gray-600 transition-all duration-300 shadow-md cursor-pointer mx-3">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-[30px] opacity-20 group-hover/item:opacity-40 transition-opacity ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      
      <div className="flex justify-between items-center mb-1 relative z-10">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate pr-2">{name}</span>
        {isPositive ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />}
      </div>

      <div className="flex items-baseline justify-between gap-4 relative z-10">
        <span className="text-xl font-bold text-gray-100 tracking-tight leading-none">
          {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        <div className={`flex items-center gap-1.5 leading-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span className="text-sm font-bold">{isPositive ? '+' : ''}{change.toFixed(2)}</span>
          <span className="text-[11px] font-semibold opacity-80 bg-white/5 px-1.5 py-0.5 rounded">
            {changePer.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-indigo-600/20 text-indigo-400 border-r-2 border-indigo-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'}`}>
    <Icon size={20} className="group-hover:scale-110 transition-transform" />
    <span className="font-medium text-sm">{label}</span>
  </NavLink>
);

const Layout = ({ children }) => {
  const { isLive, toggleLive } = useLive();
  const [marketStatus, setMarketStatus] = useState({ state: 'Closed', color: 'text-rose-400', dot: 'bg-rose-500', pulse: false });
  const [indices, setIndices] = useState([]);
  const [isMarketHours, setIsMarketHours] = useState(false);

  // Time helper (9:13 AM - 3:30 PM)
  const checkTimeWindow = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes >= 553 && currentMinutes <= 930;
  };

  const sortOrder = { 
    'NIFTY 50': 1, 'NIFTY': 1, 'NIFTY BANK': 2, 'BANK NIFTY': 2, 'SENSEX': 3, 'BSE SENSEX': 3,
    'NIFTY MID SELECT': 4, 'NIFTY MIDCAP SELECT': 4, 'NIFTY MIDCAP 100': 4, 'INDIA VIX': 5, 'VIX': 5
  };

  const getRank = (symbol) => {
    if (!symbol) return 99;
    return sortOrder[symbol.toUpperCase().trim()] || 99;
  };

  const fetchIndices = useCallback(async (force = false) => {
    // Guard: Only fetch if forced (initial load) OR if time window is valid
    if (!force && !checkTimeWindow()) return;

    try {
      const response = await dashboardService.getIndices();
      if (response.success && response.data) {
        const sortedData = [...response.data].sort((a, b) => getRank(a.tradingSymbol) - getRank(b.tradingSymbol));
        setIndices(sortedData);
      }
    } catch (error) {
      console.error("Index Fetch Error", error);
    }
  }, []);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const preOpenStart = 9 * 60;        
      const marketOpenStart = 9 * 60 + 13; 
      const marketClose = 15 * 60 + 30;   

      if (currentMinutes >= preOpenStart && currentMinutes < marketOpenStart) {
        setMarketStatus({ state: 'Pre-Open', color: 'text-amber-400', dot: 'bg-amber-500', pulse: false });
        setIsMarketHours(false);
      } else if (currentMinutes >= marketOpenStart && currentMinutes < marketClose) {
        setMarketStatus({ state: 'Market Open', color: 'text-emerald-400', dot: 'bg-emerald-500', pulse: true });
        setIsMarketHours(true);
      } else {
        setMarketStatus({ state: 'Closed', color: 'text-gray-400', dot: 'bg-gray-500', pulse: false });
        setIsMarketHours(false);
      }
    };

    // 1. Initial Load (Runs once)
    checkMarketStatus();
    fetchIndices(true); // Force fetch once so header isn't empty

    // 2. Status Interval (Updates text)
    const statusTimer = setInterval(checkMarketStatus, 10000);
    
    // 3. Data Polling Interval
    let dataTimer;
    
    // FIX: Only start polling if isLive is TRUE.
    // (Note: isLive can only be true if isMarketHours is true, due to the effect below)
    if (isLive) { 
        dataTimer = setInterval(() => fetchIndices(false), 5000);
    }

    return () => {
      clearInterval(statusTimer);
      if (dataTimer) clearInterval(dataTimer);
    };
  }, [isLive, isMarketHours, fetchIndices]);

  // Safety: Force Turn Off Live if Market Closes
  useEffect(() => {
    if (!isMarketHours && isLive) {
      toggleLive(); 
    }
  }, [isMarketHours]);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite; 
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      <aside className="w-64 border-r border-gray-800/50 bg-[#0f0f12] flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-gray-800/50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Trade<span className="text-indigo-500">Pro</span></span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Market Overview" />
          <SidebarItem to="/sectors" icon={PieChart} label="Sector Analysis" />
          <SidebarItem to="/screeners" icon={Activity} label="Screeners" />
        </nav>
        <div className="p-4 border-t border-gray-800/50">
          <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2">
            <Settings size={18} /> <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 border-b border-gray-800/50 bg-[#0f0f12]/50 backdrop-blur-sm flex items-center justify-between px-6 gap-6">
          
          <div className="flex items-center gap-3 bg-[#18181b] px-4 py-2 rounded-full border border-gray-800 whitespace-nowrap flex-shrink-0">
             <span className={`relative flex h-2.5 w-2.5`}>
                {marketStatus.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${marketStatus.dot} opacity-75`}></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${marketStatus.dot}`}></span>
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${marketStatus.color}`}>{marketStatus.state}</span>
          </div>

          <div className="flex-1 overflow-hidden relative group mask-linear-fade">
            {indices.length > 0 ? (
              <div className="animate-marquee">
                {indices.map((idx, i) => (
                  <HeaderTickerItem key={`1-${idx.tradingSymbol}-${i}`} {...idx} name={idx.tradingSymbol} value={idx.lastPrice} />
                ))}
                {indices.map((idx, i) => (
                  <HeaderTickerItem key={`2-${idx.tradingSymbol}-${i}`} {...idx} name={idx.tradingSymbol} value={idx.lastPrice} />
                ))}
              </div>
            ) : (
              <div className="flex-1 text-center text-xs text-gray-500 animate-pulse bg-[#18181b]/30 py-3 rounded-xl border border-gray-800">Loading Market Data...</div>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <button 
              onClick={() => { if (isMarketHours) toggleLive(); }}
              disabled={!isMarketHours}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                !isMarketHours
                  ? 'bg-gray-800/50 border-gray-800 text-gray-600 cursor-not-allowed opacity-50' 
                  : isLive 
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isLive && isMarketHours ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-xs font-bold tracking-wider">
                {isLive && isMarketHours ? 'LIVE' : 'PAUSED'}
              </span>
            </button>

            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-[#0f0f12]"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg cursor-pointer hover:shadow-indigo-500/20 transition-shadow"></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
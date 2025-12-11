import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, Activity, Settings, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardService } from '../services/api';

// --- Improved Header Ticker Item (Larger & clearer) ---
const HeaderTickerItem = ({ name, value, change, changePer }) => {
  const isPositive = change >= 0;
  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-2 bg-[#18181b] border border-gray-800 rounded-xl min-w-[180px] relative overflow-hidden group hover:border-gray-600 transition-all duration-300 shadow-md cursor-pointer">
      {/* Background Glow - made slightly stronger */}
      <div className={`absolute top-0 right-0 w-12 h-12 rounded-full blur-[25px] opacity-20 group-hover:opacity-40 transition-opacity ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      
      {/* Top Row: Name and Icon */}
      <div className="flex justify-between items-center mb-1 relative z-10">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{name}</span>
        {isPositive ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
      </div>

      {/* Bottom Row: Value and Changes */}
      <div className="flex items-baseline justify-between gap-3 relative z-10">
        <span className="text-lg font-bold text-gray-100 tracking-tight leading-none">
          {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        
        {/* Change Points and Percentage */}
        <div className={`flex items-center gap-1.5 leading-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span className="text-xs font-bold">
            {isPositive ? '+' : ''}{change.toFixed(2)}
          </span>
          <span className="text-[10px] font-semibold opacity-80 bg-white/5 px-1 py-0.5 rounded">
            {changePer.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive 
          ? 'bg-indigo-600/20 text-indigo-400 border-r-2 border-indigo-500' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
      }`
    }
  >
    <Icon size={20} className="group-hover:scale-110 transition-transform" />
    <span className="font-medium text-sm">{label}</span>
  </NavLink>
);

const Layout = ({ children }) => {
  const [marketStatus, setMarketStatus] = useState({ state: 'Closed', color: 'text-rose-400', dot: 'bg-rose-500', pulse: false });
  const [indices, setIndices] = useState([]);

  // --- SORT ORDER CONFIG ---
  const sortOrder = { 
    'NIFTY 50': 1, 
    'NIFTY': 1,
    'NIFTY BANK': 2, 
    'BANK NIFTY': 2,
    'SENSEX': 3,
    'BSE SENSEX': 3,
    'NIFTY MID SELECT': 4,
    'NIFTY MIDCAP SELECT': 4,
    'NIFTY MIDCAP 100': 4,
    'INDIA VIX': 5,
    'VIX': 5
  };

  const getRank = (symbol) => {
    if (!symbol) return 99;
    const upperSym = symbol.toUpperCase().trim();
    return sortOrder[upperSym] || 99;
  };

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const preOpenStart = 9 * 60;
      const marketOpenStart = 9 * 60 + 15;
      const marketClose = 15 * 60 + 30;

      if (currentMinutes >= preOpenStart && currentMinutes < marketOpenStart) {
        setMarketStatus({ state: 'Pre-Open', color: 'text-amber-400', dot: 'bg-amber-500', pulse: false });
      } else if (currentMinutes >= marketOpenStart && currentMinutes < marketClose) {
        setMarketStatus({ state: 'Market Open', color: 'text-emerald-400', dot: 'bg-emerald-500', pulse: true });
      } else {
        setMarketStatus({ state: 'Closed', color: 'text-gray-400', dot: 'bg-gray-500', pulse: false });
      }
    };

    const fetchIndices = async () => {
      const response = await dashboardService.getIndices();
      if (response.success && response.data) {
        const sortedData = [...response.data].sort((a, b) => {
          return getRank(a.tradingSymbol) - getRank(b.tradingSymbol);
        });
        setIndices(sortedData);
      }
    };

    checkMarketStatus();
    fetchIndices();

    const statusTimer = setInterval(checkMarketStatus, 60000);
    const dataTimer = setInterval(fetchIndices, 5000);

    return () => {
      clearInterval(statusTimer);
      clearInterval(dataTimer);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800/50 bg-[#0f0f12] flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-6 border-b border-gray-800/50">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Trade<span className="text-indigo-500">Pro</span>
          </span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Market Overview" />
          <SidebarItem to="/sectors" icon={PieChart} label="Sector Analysis" />
          <SidebarItem to="/screeners" icon={Activity} label="Screeners" />
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header - Increased Height to h-20 (80px) to fit larger cards */}
        <header className="h-20 border-b border-gray-800/50 bg-[#0f0f12]/50 backdrop-blur-sm flex items-center justify-between px-6 gap-6">
          
          {/* Left: Dynamic Market Status */}
          <div className="flex items-center gap-3 bg-[#18181b] px-4 py-2 rounded-full border border-gray-800 whitespace-nowrap flex-shrink-0">
             <span className={`relative flex h-2.5 w-2.5`}>
                {marketStatus.pulse && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${marketStatus.dot} opacity-75`}></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${marketStatus.dot}`}></span>
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${marketStatus.color}`}>
                {marketStatus.state}
              </span>
          </div>

          {/* Middle: Indices Ticker (Larger Cards) */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-4 w-full">
              {indices.length > 0 ? (
                indices.map((idx) => (
                  <HeaderTickerItem 
                    key={idx.tradingSymbol}
                    name={idx.tradingSymbol}
                    value={idx.lastPrice}
                    change={idx.change}
                    changePer={idx.changePer}
                  />
                ))
              ) : (
                <div className="flex-1 text-center text-xs text-gray-500 animate-pulse bg-[#18181b]/30 py-3 rounded-xl border border-gray-800">
                  Loading Market Data...
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-[#0f0f12]"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg cursor-pointer hover:shadow-indigo-500/20 transition-shadow"></div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
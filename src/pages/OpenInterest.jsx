import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dashboardService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ReferenceLine 
} from 'recharts';
import { RefreshCw, Layers, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLive } from '../context/LiveContext';

// --- Searchable Select (Unchanged) ---
const SearchableSelect = ({ label, options = [], value, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen && value) setSearchTerm(value);
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value || ''); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!isOpen || searchTerm === value) return options;
    return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm, isOpen, value]);

  return (
    <div className="flex flex-col gap-1 relative w-48" ref={wrapperRef}>
      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-[#18181b] text-gray-200 text-xs px-3 py-2 rounded-lg border outline-none uppercase placeholder-gray-600 transition-all ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-gray-800'}`}
          placeholder={placeholder}
          value={searchTerm}
          onClick={() => { setIsOpen(true); setSearchTerm(''); }}
          onChange={(e) => { setSearchTerm(e.target.value.toUpperCase()); setIsOpen(true); }}
        />
        <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181b] border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${value === opt ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-300 hover:bg-white/5'}`}
                onMouseDown={() => { onChange(opt); setSearchTerm(opt); setIsOpen(false); }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-[10px] text-gray-500">No Match</div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Filter Select (Unchanged) ---
const FilterSelect = ({ label, value, options, onChange, disabled, width = "min-w-[120px]" }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`bg-[#18181b] text-gray-200 text-xs px-3 py-2 rounded-lg border border-gray-800 focus:border-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed h-[34px] ${width}`}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const OpenInterest = () => {
  const { isLive } = useLive();
  const [symbols, setSymbols] = useState([]);
  const [expiries, setExpiries] = useState([]);
  const [oiData, setOiData] = useState(null);
  
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [limit, setLimit] = useState('10');
  const [activeTab, setActiveTab] = useState('change'); 
  const [loading, setLoading] = useState(false);

  const limitOptions = ['5', '10', '15', '20', '25', '30', '50'];

  // 1. Load Symbols
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await dashboardService.getOptionSymbols();
        if (res.success && Array.isArray(res.data)) {
          const valid = res.data.map(s => s.symbol).filter(s => s && s.trim() !== '').sort();
          const unique = [...new Set(valid)];
          setSymbols(unique);
          if (!selectedSymbol) {
            if (unique.includes('NIFTY')) setSelectedSymbol('NIFTY');
            else if (unique.length > 0) setSelectedSymbol(unique[0]);
          }
        }
      } catch (e) { console.error("Symbol fetch error", e); }
    };
    fetchSymbols();
  }, []);

  // 2. Load Expiries
  useEffect(() => {
    if (!selectedSymbol) return;
    const fetchExpiries = async () => {
      try {
        const res = await dashboardService.getOptionExpiries(selectedSymbol);
        if (res.success && res.data?.expiryDates) {
          setExpiries(res.data.expiryDates);
          if (res.data.expiryDates.length > 0) setSelectedExpiry(res.data.expiryDates[0]);
          else setSelectedExpiry('');
        }
      } catch (e) { console.error(e); }
    };
    fetchExpiries();
  }, [selectedSymbol]);

  // 3. Load Data
  const fetchData = async () => {
    if (!selectedSymbol || !selectedExpiry) return;
    setLoading(true);
    try {
      const res = await dashboardService.getOpenInterestData(selectedSymbol, selectedExpiry, limit);
      if (res.success) setOiData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    let interval;
    if (isLive) interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedSymbol, selectedExpiry, limit, isLive]);

  // --- Process Data ---
  const { chartData, atmStrike } = useMemo(() => {
    if (!oiData?.strikes) return { chartData: [], atmStrike: null };
    let atmVal = null;
    const processed = oiData.strikes.map(s => {
      if (s.atm) atmVal = s.strikePrice;
      return {
        strike: s.strikePrice,
        ceChange: s.ceOiChange, peChange: s.peOiChange,
        ceTotal: s.ceTotalOi, peTotal: s.peTotalOi,
        isAtm: s.atm
      };
    });
    processed.sort((a, b) => a.strike - b.strike);
    return { chartData: processed, atmStrike: atmVal };
  }, [oiData]);

  const pcrStats = useMemo(() => {
    if (!oiData?.strikes) return { pcr: 0, totalCe: 0, totalPe: 0, changeCe: 0, changePe: 0 };
    const totalCe = oiData.strikes.reduce((a, b) => a + b.ceTotalOi, 0);
    const totalPe = oiData.strikes.reduce((a, b) => a + b.peTotalOi, 0);
    const changeCe = oiData.strikes.reduce((a, b) => a + b.ceOiChange, 0);
    const changePe = oiData.strikes.reduce((a, b) => a + b.peOiChange, 0);
    return { totalCe, totalPe, changeCe, changePe, pcr: totalCe ? (totalPe / totalCe).toFixed(2) : 0 };
  }, [oiData]);

  const pcrDonut = [
    { name: 'Put OI', value: pcrStats.totalPe, color: '#10b981' },
    { name: 'Call OI', value: pcrStats.totalCe, color: '#f43f5e' }
  ];
  
  const netChangeData = [
    { name: 'PE Chg', value: pcrStats.changePe },
    { name: 'CE Chg', value: pcrStats.changeCe }
  ];

  const dynamicBarSize = useMemo(() => {
    const count = chartData.length || 1;
    if (count <= 10) return 20; 
    if (count <= 20) return 12; 
    if (count <= 30) return 8;
    return 4;
  }, [chartData.length]);

  const tooltipStyle = {
    backgroundColor: '#18181b', 
    borderColor: '#27272a', 
    borderRadius: '8px',
    color: '#e4e4e7' 
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="text-indigo-500" size={24} />Open Interest Analysis
            </h1>
            <p className="text-gray-400 text-xs mt-1">Real-time Options Chain & OI Analytics</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 w-full md:w-auto z-50">
            <SearchableSelect label="Symbol" options={symbols} value={selectedSymbol} onChange={setSelectedSymbol} />
            <FilterSelect label="Expiry" options={expiries} value={selectedExpiry} onChange={setSelectedExpiry} disabled={!selectedSymbol} />
            <FilterSelect label="Limit" options={limitOptions} value={limit} onChange={setLimit} width="min-w-[70px]" />
            <button onClick={fetchData} className="mb-[1px] p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-[34px] w-[34px] flex items-center justify-center">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {oiData ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-3 bg-[#0f0f12] border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col h-[600px] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              
              {/* --- PERFECTLY ALIGNED TOGGLE SLIDER --- */}
              <div className="grid grid-cols-2 w-[240px] bg-[#18181b] p-1 rounded-lg border border-gray-800 relative">
                {/* Background Pill */}
                <motion.div 
                  layoutId="activeTabPillOI"
                  className="absolute top-1 bottom-1 left-1 rounded bg-indigo-500/20"
                  style={{ width: 'calc(50% - 4px)' }} // Exact calculation to account for padding
                  initial={false}
                  animate={{ x: activeTab === 'change' ? '0%' : '100%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                
                {/* Buttons (Equal Width) */}
                <button 
                  onClick={() => setActiveTab('change')} 
                  className={`relative z-10 py-1.5 text-xs font-bold rounded transition-colors text-center w-full ${activeTab === 'change' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Change in OI
                </button>
                <button 
                  onClick={() => setActiveTab('total')} 
                  className={`relative z-10 py-1.5 text-xs font-bold rounded transition-colors text-center w-full ${activeTab === 'total' ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Total OI
                </button>
              </div>

              <div className="text-xs font-mono text-gray-500 bg-[#18181b] px-3 py-1 rounded border border-gray-800">
                Spot: <span className="text-emerald-400 font-bold text-sm ml-1">{oiData?.spotPrice ? oiData.spotPrice.toLocaleString('en-IN') : 'N/A'}</span>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full absolute inset-0"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'change' ? (
                      // TAB 1: Horizontal Bar
                      <BarChart 
                        layout="vertical" 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                        barCategoryGap="20%" 
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="strike" type="category" tick={{ fill: '#e4e4e7', fontSize: 11, fontWeight: 'bold' }} interval={0} axisLine={false} tickLine={false} width={60} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e4e4e7' }} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                        <Legend />
                        {atmStrike && <ReferenceLine y={atmStrike} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'right', value: 'ATM', fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }} />}
                        <Bar dataKey="ceChange" name="Call Change" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={dynamicBarSize} />
                        <Bar dataKey="peChange" name="Put Change" fill="#10b981" radius={[0, 4, 4, 0]} barSize={dynamicBarSize} />
                      </BarChart>
                    ) : (
                      // TAB 2: Vertical Bar
                      <BarChart 
                        data={chartData} 
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        barCategoryGap="20%" 
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="strike" tick={{ fill: '#71717a', fontSize: 10 }} interval={0} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e4e4e7' }} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                        <Legend />
                        {atmStrike && <ReferenceLine x={atmStrike} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'top', value: 'ATM', fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }} />}
                        <Bar dataKey="peTotal" name="Put Total" fill="#10b981" radius={[2, 2, 0, 0]} barSize={dynamicBarSize} />
                        <Bar dataKey="ceTotal" name="Call Total" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={dynamicBarSize} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Widgets */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-6 shadow-lg h-[290px] flex flex-col items-center justify-center relative">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">PCR Ratio</h3>
              <div className="w-full h-full relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pcrDonut} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {pcrDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e4e4e7' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-3xl font-bold ${pcrStats.pcr > 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{pcrStats.pcr}</span>
                  <span className="text-[10px] text-gray-500 uppercase mt-1">Bullish &gt; 1</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f12] border border-gray-800 rounded-xl p-6 shadow-lg h-[285px] flex flex-col">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Net OI Change</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer>
                  <BarChart data={netChangeData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} itemStyle={{ color: '#e4e4e7' }} />
                    <Bar dataKey="value">
                      {netChangeData.map((e, i) => <Cell key={i} fill={e.name.includes('PE') ? '#10b981' : '#f43f5e'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-4">
          <Layers size={48} className="opacity-20" />
          <p>Select a Symbol and Expiry to view Open Interest Data</p>
        </div>
      )}
    </div>
  );
};

export default OpenInterest;
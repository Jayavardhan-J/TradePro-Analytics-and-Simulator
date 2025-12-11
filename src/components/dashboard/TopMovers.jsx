import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TopMovers = () => {
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [loading, setLoading] = useState(true);

  const fetchMovers = async () => {
    const response = await dashboardService.getTopMovers();
    if (response.success && response.data) {
      // Sort and split the data
      const sortedData = [...response.data].sort((a, b) => b.changePer - a.changePer);
      const gainers = sortedData.filter(item => item.changePer > 0).slice(0, 5);
      const losers = sortedData.filter(item => item.changePer < 0).sort((a,b) => a.changePer - b.changePer).slice(0, 5);
      
      setMovers({ gainers, losers });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovers(); // Initial fetch
    const interval = setInterval(fetchMovers, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-48 bg-[#0f0f12] rounded-xl animate-pulse border border-gray-800" />;

  const StockCard = ({ stock, type }) => {
    const isGainer = type === 'gainer';
    return (
      <div className="flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-lg transition-colors group cursor-pointer">
        <div>
          <h4 className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">{stock.symbol}</h4>
          <span className="text-xs text-gray-500 font-mono">₹{stock.lastPrice.toLocaleString()}</span>
        </div>
        <div className="text-right">
          <div className={`flex items-center justify-end font-bold text-sm ${isGainer ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isGainer ? '+' : ''}{stock.changePer.toFixed(2)}%
            {isGainer ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          </div>
          <span className={`text-xs font-mono ${isGainer ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
            {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gainers Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f12] border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800/50">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <h3 className="font-semibold text-gray-100">Top Gainers</h3>
          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded ml-auto">Real-time</span>
        </div>
        <div className="space-y-1">
          {movers.gainers.map(stock => <StockCard key={stock.symbol} stock={stock} type="gainer" />)}
        </div>
      </motion.div>

      {/* Losers Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#0f0f12] border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800/50">
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <TrendingDown size={18} className="text-rose-400" />
          </div>
          <h3 className="font-semibold text-gray-100">Top Losers</h3>
          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded ml-auto">Real-time</span>
        </div>
        <div className="space-y-1">
          {movers.losers.map(stock => <StockCard key={stock.symbol} stock={stock} type="loser" />)}
        </div>
      </motion.div>
    </div>
  );
};

export default TopMovers;
import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectorConstituents = ({ stocks, sectorName }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'changePer', direction: 'desc' });

  // --- Normalization & Strict Deduplication ---
  const sortedStocks = useMemo(() => {
    if (!stocks || !Array.isArray(stocks)) return [];

    const normalized = stocks.map(s => {
      const rawSymbol = s.symbol || s.tradingSymbol || s.ticker || "";
      return {
        ...s,
        validSymbol: rawSymbol.trim().toUpperCase() || "UNKNOWN",
        validPrice: parseFloat(s.lastPrice || s.ltp || 0),
        validChange: parseFloat(s.change || s.netChange || 0),
        validChangePer: parseFloat(s.changePer || s.pChange || 0)
      };
    });

    const validRows = normalized.filter(s => s.validSymbol !== "UNKNOWN" && s.validSymbol.length > 0);

    // Deduplicate
    const uniqueMap = new Map();
    validRows.forEach(item => {
      if (uniqueMap.has(item.validSymbol)) {
        const existing = uniqueMap.get(item.validSymbol);
        if (existing.validPrice === 100000 && item.validPrice !== 100000) {
           uniqueMap.set(item.validSymbol, item);
        }
      } else {
        uniqueMap.set(item.validSymbol, item);
      }
    });

    const uniqueStocks = Array.from(uniqueMap.values());

    if (sortConfig !== null) {
      uniqueStocks.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case 'symbol': aValue = a.validSymbol; bValue = b.validSymbol; break;
          case 'lastPrice': aValue = a.validPrice; bValue = b.validPrice; break;
          case 'change': aValue = a.validChange; bValue = b.validChange; break;
          case 'changePer': aValue = a.validChangePer; bValue = b.validChangePer; break;
          default: aValue = a[sortConfig.key]; bValue = b[sortConfig.key];
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return uniqueStocks;
  }, [stocks, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown size={12} className="text-gray-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-indigo-400 ml-1" /> : <ArrowDown size={12} className="text-indigo-400 ml-1" />;
  };

  const HeaderCell = ({ label, sortKey, align = "left", widthClass }) => (
    <th 
      className={`px-3 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer transition-colors hover:text-gray-300 hover:bg-white/[0.02] group select-none border-none outline-none focus:outline-none focus:ring-0 ${align === 'right' ? 'text-right' : 'text-left'} ${widthClass}`}
      onClick={() => requestSort(sortKey)}
      tabIndex="-1"
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} outline-none border-none`}>
        {label}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0f0f12] shadow-xl flex flex-col h-[600px]">
      <style>{`th:focus, *:focus-visible { outline: none !important; box-shadow: none !important; }`}</style>

      {/* Header Bar */}
      <div className="bg-[#18181b]/50 px-4 py-3 border-b border-gray-800 flex justify-between items-center backdrop-blur-sm sticky top-0 z-20">
        <h3 className="font-semibold text-gray-200 text-base truncate pr-2">
          Constituents: <span className="text-indigo-400">{sectorName}</span>
        </h3>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700 whitespace-nowrap">
          {sortedStocks.length} Sym
        </span>
      </div>
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#121215] sticky top-0 z-10 shadow-lg">
            <tr>
              <HeaderCell label="Symbol" sortKey="symbol" widthClass="w-[30%]" />
              <HeaderCell label="Price" sortKey="lastPrice" align="right" widthClass="w-[22%]" />
              <HeaderCell label="Chg" sortKey="change" align="right" widthClass="w-[20%]" />
              <HeaderCell label="%" sortKey="changePer" align="right" widthClass="w-[28%]" />
            </tr>
          </thead>
          
          <AnimatePresence mode="wait">
            {/* Animating the entire TBODY creates the block-swipe effect */}
            <motion.tbody 
              key={sectorName} // Triggers animation on sector switch
              initial={{ opacity: 0, x: 10 }} // Slide in from right
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} // Slide out to left
              transition={{ duration: 0.15 }} // Fast, matching TopMovers
              className="divide-y divide-gray-800/50"
            >
              {sortedStocks.length > 0 ? (
                sortedStocks.map((stock) => {
                  const isPositive = stock.validChangePer >= 0;
                  const uniqueKey = `${sectorName}-${stock.validSymbol}`;

                  return (
                    <tr 
                      key={uniqueKey}
                      className="hover:bg-indigo-500/[0.03] transition-colors group border-none outline-none"
                    >
                      <td className="px-3 py-3 text-xs font-bold text-gray-300 group-hover:text-white truncate border-none">
                        {stock.validSymbol}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-300 text-right font-mono tracking-wide whitespace-nowrap border-none">
                        {stock.validPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-3 py-3 text-xs text-right font-mono whitespace-nowrap border-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stock.validChange > 0 ? '+' : ''}{stock.validChange.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right border-none">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border justify-end min-w-[60px] ${
                          isPositive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isPositive ? <ArrowUp size={10} className="mr-0.5 stroke-[3]"/> : <ArrowDown size={10} className="mr-0.5 stroke-[3]"/>}
                          {Math.abs(stock.validChangePer).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr key="no-data">
                  <td colSpan="4" className="px-6 py-20 text-center text-gray-500 border-none">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm">Select a sector to view constituents</p>
                    </div>
                  </td>
                </tr>
              )}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>
    </div>
  );
};

export default SectorConstituents;
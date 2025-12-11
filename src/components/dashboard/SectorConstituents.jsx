import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

const SectorConstituents = ({ stocks, sectorName }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'changePer', direction: 'desc' });

  // --- Sorting Logic (Fixed for Numbers) ---
  const sortedStocks = useMemo(() => {
    let sortableItems = [...stocks];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // FORCE NUMBER CONVERSION for numeric columns
        if (['lastPrice', 'change', 'changePer'].includes(sortConfig.key)) {
           aValue = parseFloat(aValue);
           bValue = parseFloat(bValue);
        }

        // Handle Strings (Case insensitive)
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [stocks, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc'; // Default to descending for numbers usually
    // If clicking the same column, toggle direction
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown size={12} className="text-gray-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="text-indigo-400 ml-1" /> 
      : <ArrowDown size={12} className="text-indigo-400 ml-1" />;
  };

  const HeaderCell = ({ label, sortKey, align = "left", widthClass }) => (
    <th 
      className={`px-3 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer transition-colors hover:text-gray-300 hover:bg-white/[0.02] group select-none outline-none border-none focus:outline-none focus:ring-0 active:outline-none ${align === 'right' ? 'text-right' : 'text-left'} ${widthClass}`}
      onClick={() => requestSort(sortKey)}
      tabIndex="-1" 
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0f0f12] shadow-xl flex flex-col h-[600px]">
      
      <style>{`
        *:focus, *:active, th:focus, tr:focus, td:focus {
          outline: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>

      {/* Header Bar */}
      <div className="bg-[#18181b]/50 px-4 py-3 border-b border-gray-800 flex justify-between items-center backdrop-blur-sm sticky top-0 z-20">
        <h3 className="font-semibold text-gray-200 text-base truncate pr-2">
          Constituents: <span className="text-indigo-400">{sectorName}</span>
        </h3>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded border border-gray-700 whitespace-nowrap">
          {stocks.length} Sym
        </span>
      </div>
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#121215] sticky top-0 z-10 shadow-lg outline-none border-none">
            <tr>
              <HeaderCell label="Symbol" sortKey="symbol" widthClass="w-[30%]" />
              <HeaderCell label="Price" sortKey="lastPrice" align="right" widthClass="w-[22%]" />
              <HeaderCell label="Chg" sortKey="change" align="right" widthClass="w-[20%]" />
              <HeaderCell label="%" sortKey="changePer" align="right" widthClass="w-[28%]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {sortedStocks.length > 0 ? (
              sortedStocks.map((stock, index) => {
                const isPositive = stock.changePer >= 0;
                // Add a unique key combining symbol and index to handle potential API duplicates
                return (
                  <tr 
                    key={`${stock.symbol}-${index}`} 
                    className="hover:bg-indigo-500/[0.03] transition-colors group outline-none border-none focus:outline-none"
                    tabIndex="-1"
                  >
                    <td className="px-3 py-3 text-xs font-bold text-gray-300 group-hover:text-white truncate border-none outline-none">
                      {stock.symbol}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-300 text-right font-mono tracking-wide whitespace-nowrap border-none outline-none">
                      {stock.lastPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-3 py-3 text-xs text-right font-mono whitespace-nowrap border-none outline-none ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right border-none outline-none">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border justify-end min-w-[60px] ${
                        isPositive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {isPositive ? <ArrowUp size={10} className="mr-0.5 stroke-[3]"/> : <ArrowDown size={10} className="mr-0.5 stroke-[3]"/>}
                        {Math.abs(stock.changePer).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-gray-500 border-none outline-none">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm">Select a sector to view</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectorConstituents;
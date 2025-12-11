import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

// Using memo to prevent re-renders unless data/selection changes
const SectorPerformance = memo(({ data, onSectorClick, onSectorHover, selectedSector }) => {
  return (
    <div className="h-[450px] w-full touch-auto" style={{ outline: 'none' }}>
      <style>{`
        .recharts-wrapper, .recharts-surface, .recharts-layer { outline: none !important; }
        *:focus { outline: none !important; box-shadow: none !important; }
      `}</style>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 60 }}
          onMouseLeave={() => onSectorHover(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          
          <XAxis 
            dataKey="indexName" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }} 
            interval={0}
            angle={-45}
            textAnchor="end"
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 11 }} 
          />

          <Bar 
            dataKey="changePer" 
            radius={[4, 4, 4, 4]} 
            animationDuration={800}
            barSize={45} 
            // Removed onClick from here to prevent event bubbling issues
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.changePer >= 0 ? '#10b981' : '#ef4444'} 
                fillOpacity={selectedSector === entry.indexName ? 1 : 0.3}
                stroke={selectedSector === entry.indexName ? 'white' : 'transparent'}
                strokeWidth={selectedSector === entry.indexName ? 2 : 0}
                
                // --- FIX: Direct Event Handling on the Cell ---
                onClick={() => {
                  if (onSectorClick) {
                    onSectorClick(entry.indexName);
                  }
                }}
                onMouseEnter={() => onSectorHover(entry)}
                
                className="transition-all duration-200 cursor-pointer hover:opacity-100 outline-none"
                role="button" // Accessibility hint
                tabIndex={-1} // Prevents focus ring
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default SectorPerformance;
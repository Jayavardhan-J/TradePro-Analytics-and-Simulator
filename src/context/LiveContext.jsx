import React, { createContext, useState, useContext } from 'react';

const LiveContext = createContext();

export const LiveProvider = ({ children }) => {
  // Default to false (Manual/Off) or true (Auto/Live) as you prefer
  const [isLive, setIsLive] = useState(true); 

  const toggleLive = () => setIsLive(prev => !prev);

  return (
    <LiveContext.Provider value={{ isLive, toggleLive }}>
      {children}
    </LiveContext.Provider>
  );
};

export const useLive = () => useContext(LiveContext);
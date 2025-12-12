import React, { createContext, useState, useContext, useEffect } from 'react';

const LiveContext = createContext();

export const LiveProvider = ({ children }) => {
  // Initialize state from Local Storage (Default to true if not found)
  const [isLive, setIsLive] = useState(() => {
    const savedState = localStorage.getItem('isLiveMode');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Save to Local Storage whenever isLive changes
  useEffect(() => {
    localStorage.setItem('isLiveMode', JSON.stringify(isLive));
  }, [isLive]);

  const toggleLive = () => setIsLive(prev => !prev);

  return (
    <LiveContext.Provider value={{ isLive, toggleLive }}>
      {children}
    </LiveContext.Provider>
  );
};

export const useLive = () => useContext(LiveContext);
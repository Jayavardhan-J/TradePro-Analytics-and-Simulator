const BASE_URL = '/api/v1/dashboard'; 

export const dashboardService = {
  // --- EXISTING METHODS (UNCHANGED) ---
  getSectorPerformance: async () => {
    try {
      const response = await fetch(`${BASE_URL}/sectors/performance`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error (Sectors):", error);
      return { success: false, data: [] }; 
    }
  },

  getSectorConstituents: async () => {
    try {
      const response = await fetch(`${BASE_URL}/sectors/stocks`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error (Constituents):", error);
      return { success: false, data: [] };
    }
  },

  getIndices: async () => {
    try {
      const response = await fetch(`${BASE_URL}/indices/prices`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error (Indices):", error);
      return { success: false, data: [] };
    }
  },

  getMarketBreadth: async () => {
    try {
      const response = await fetch(`${BASE_URL}/market-breadth`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error (Breadth):", error);
      return { success: false, data: { advances: 0, declines: 0, total: 0 } };
    }
  },

  getTopMovers: async () => {
    try {
      const response = await fetch(`${BASE_URL}/sectors/top-movers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API Error (Top Movers):", error);
      return { success: false, data: [] };
    }
  },

  // --- NEW OPTIONS ENDPOINTS (FIXED) ---
  
getOptionSymbols: async () => {
    try {
      const response = await fetch(`${BASE_URL}/options/symbols`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching symbols:", error);
      return { success: false, data: [] };
    }
  },

  getOptionExpiries: async (symbol, segment = 'NFO') => {
    try {
      if (!symbol) return { success: false, data: { expiryDates: [] } };
      
      const response = await fetch(`${BASE_URL}/options/expiries?symbol=${symbol.toUpperCase()}&exchange=${segment}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching expiries:", error);
      return { success: false, data: { expiryDates: [] } };
    }
  },

  // --- UPDATED METHOD: Accepts limit ---
  getOpenInterestData: async (symbol, expiry, limit = 10) => {
    try {
      if (!symbol || !expiry) return { success: false, data: null };

      const response = await fetch(`${BASE_URL}/options/open-interest?symbol=${symbol.toUpperCase()}&expiry=${expiry}&limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching OI data:", error);
      return { success: false, data: null };
    }
  }
};
const BASE_URL = '/api/v1/dashboard'; 

export const dashboardService = {
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

  // --- NEW METHOD ADDED HERE ---
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
      // Fallback to prevent crash
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
  }
};
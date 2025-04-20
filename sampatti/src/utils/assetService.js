// src/utils/assetService.js
// This file handles all API interactions related to assets/investments

/**
 * Creates a new asset
 * @param {Object} assetData - The asset data to create
 * @returns {Promise<Object>} - The created asset
 */
export const createAsset = async (assetData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create asset (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  };
  
  /**
   * Fetches all assets for the authenticated user
   * @returns {Promise<Array>} - Array of assets
   */
  export const getAllAssets = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch assets (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  };
  
  /**
   * Fetches a specific asset by ID
   * @param {string} assetId - The ID of the asset to fetch
   * @returns {Promise<Object>} - The asset object
   */
  export const getAssetById = async (assetId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/${assetId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch asset (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching asset ${assetId}:`, error);
      throw error;
    }
  };
  
  /**
   * Updates an existing asset
   * @param {string} assetId - The ID of the asset to update
   * @param {Object} assetData - The updated asset data
   * @returns {Promise<Object>} - The updated asset
   */
  export const updateAsset = async (assetId, assetData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assetData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update asset (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating asset ${assetId}:`, error);
      throw error;
    }
  };
  
  /**
   * Updates just the current value of an asset
   * @param {string} assetId - The ID of the asset
   * @param {number} value - The new current value
   * @param {string} notes - Optional notes about the update
   * @returns {Promise<Object>} - The response
   */
  export const updateAssetValue = async (assetId, value, notes = '') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/${assetId}/value`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value, notes })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update asset value (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating asset value for ${assetId}:`, error);
      throw error;
    }
  };
  
  /**
   * Deletes an asset
   * @param {string} assetId - The ID of the asset to delete
   * @returns {Promise<void>}
   */
  export const deleteAsset = async (assetId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete asset (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error deleting asset ${assetId}:`, error);
      throw error;
    }
  };
  
  /**
   * Gets a portfolio summary
   * @returns {Promise<Object>} - Portfolio summary data
   */
  export const getPortfolioSummary = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/assets/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch portfolio summary (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      throw error;
    }
  };
  
  /**
   * Gets assets by type
   * @param {string} assetType - The type of assets to fetch
   * @returns {Promise<Array>} - Array of assets of the specified type
   */
  export const getAssetsByType = async (assetType) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/types/${assetType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch assets by type (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching assets of type ${assetType}:`, error);
      throw error;
    }
  };
  
  /**
   * Gets asset history
   * @param {string} assetId - The ID of the asset
   * @returns {Promise<Array>} - Array of historical values
   */
  export const getAssetHistory = async (assetId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/assets/${assetId}/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch asset history (${response.status})`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching history for asset ${assetId}:`, error);
      throw error;
    }
  };
  
  // Export all methods
  export default {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    updateAssetValue,
    deleteAsset,
    getPortfolioSummary,
    getAssetsByType,
    getAssetHistory
  };
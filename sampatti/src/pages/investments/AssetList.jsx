import React, { useState, useEffect } from 'react';
import { PlusCircle, Filter, Search, TrendingUp, TrendingDown, Info, Edit, Trash2, ExternalLink } from 'lucide-react';
import { getAllAssets, deleteAsset } from '../../utils/assetService';

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'assetName', direction: 'asc' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch assets on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const data = await getAllAssets();
        setAssets(data);
        setFilteredAssets(data);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load investments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Filter assets based on search term and filter type
  useEffect(() => {
    let result = assets;
    
    // Apply type filter
    if (filterType !== 'All') {
      result = result.filter(asset => asset.assetType === filterType);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(asset => 
        asset.assetName.toLowerCase().includes(lowercasedTerm) ||
        asset.institution?.toLowerCase().includes(lowercasedTerm) ||
        asset.accountNumber?.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredAssets(result);
  }, [assets, searchTerm, filterType, sortConfig]);

  // Extract unique asset types for filter dropdown
  const assetTypes = ['All', ...new Set(assets.map(asset => asset.assetType))].filter(Boolean);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Calculate ROI (Return on Investment)
  const calculateROI = (currentValue, totalInvestment) => {
    if (!totalInvestment) return null;
    return ((currentValue - totalInvestment) / totalInvestment) * 100;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Handle asset deletion
  const handleDelete = async (id) => {
    try {
      await deleteAsset(id);
      setAssets(assets.filter(asset => asset.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Failed to delete investment. Please try again.');
    }
  };

  // Total portfolio value
  const totalPortfolioValue = filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalInvestment = filteredAssets.reduce((sum, asset) => sum + asset.totalInvestment, 0);
  const portfolioROI = calculateROI(totalPortfolioValue, totalInvestment);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Investments</h1>
          <p className="text-gray-400">Manage and track all your investments in one place</p>
        </div>
        <a 
          href="/investments/add" 
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusCircle size={18} className="mr-2" />
          Add Investment
        </a>
      </div>

      {/* Portfolio summary card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalPortfolioValue)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalInvestment)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Overall Return</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold mr-2 whitespace-nowrap">
                {portfolioROI !== null ? `${portfolioROI.toFixed(2)}%` : 'N/A'}
              </p>
              {portfolioROI > 0 ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : portfolioROI < 0 ? (
                <TrendingDown className="text-red-500" size={20} />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={18} className="text-gray-500" />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {assetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-white">Loading investments...</span>
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('assetName')}
                  >
                    <div className="flex items-center">
                      Investment
                      {sortConfig.key === 'assetName' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('assetType')}
                  >
                    <div className="flex items-center">
                      Type
                      {sortConfig.key === 'assetType' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('currentValue')}
                  >
                    <div className="flex items-center">
                      Current Value
                      {sortConfig.key === 'currentValue' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('purchaseDate')}
                  >
                    <div className="flex items-center">
                      Purchase Date
                      {sortConfig.key === 'purchaseDate' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Return
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredAssets.map((asset) => {
                  const roi = calculateROI(asset.currentValue, asset.totalInvestment);
                  
                  return (
                    <tr key={asset.id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{asset.assetName}</div>
                          {asset.institution && (
                            <div className="text-xs text-gray-400">{asset.institution}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400">
                          {asset.assetType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatDate(asset.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {roi !== null ? (
                          <div className={`flex items-center text-sm ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {roi >= 0 ? (
                              <TrendingUp className="mr-1" size={16} />
                            ) : (
                              <TrendingDown className="mr-1" size={16} />
                            )}
                            {roi.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <a 
                            href={`/investments/${asset.id}`}
                            className="text-gray-400 hover:text-white"
                            title="View details"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <a 
                            href={`/investments/${asset.id}/edit`}
                            className="text-blue-400 hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </a>
                          <button 
                            onClick={() => setDeleteConfirm(asset.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Info size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No investments found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterType !== 'All' 
                ? "Try changing your search or filter criteria" 
                : "Get started by adding your first investment"}
            </p>
            {!searchTerm && filterType === 'All' && (
              <a 
                href="/investments/add" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <PlusCircle size={18} className="mr-2" />
                Add Investment
              </a>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this investment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
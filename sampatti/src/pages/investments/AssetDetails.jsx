import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, FileText, Calculator, 
  TrendingUp, TrendingDown, Calendar, Tag, AlertTriangle 
} from 'lucide-react';

import { getAssetById, deleteAsset, getAssetHistory, updateAssetValue } from '../../utils/assetService';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [updateValueModal, setUpdateValueModal] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [valueNotes, setValueNotes] = useState('');
  const [valueUpdateLoading, setValueUpdateLoading] = useState(false);

  // Fetch asset details and history on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch asset details
        const assetData = await getAssetById(id);
        setAsset(assetData);
        
        // Fetch asset history
        const historyData = await getAssetHistory(id);
        setHistory(historyData);
        
      } catch (err) {
        console.error('Error fetching asset details:', err);
        setError('Failed to load investment details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calculate ROI (Return on Investment)
  const calculateROI = (current_value, total_investment) => {
    if (!total_investment) return null;
    return ((current_value - total_investment) / total_investment) * 100;
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Handle asset deletion
  const handleDelete = async () => {
    try {
      await deleteAsset(id);
      navigate('/investments', { 
        state: { message: 'Investment deleted successfully' } 
      });
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Failed to delete investment. Please try again.');
    }
  };

  // Handle value update submission
  const handleValueUpdate = async (e) => {
    e.preventDefault();
    
    if (!newValue) {
      return;
    }
    
    try {
      setValueUpdateLoading(true);
      await updateAssetValue(id, parseFloat(newValue), valueNotes);
      
      // Update the local asset state with new value
      setAsset(prev => ({
        ...prev,
        current_value: parseFloat(newValue)
      }));
      
      // Close modal and reset fields
      setUpdateValueModal(false);
      setNewValue('');
      setValueNotes('');
      
    } catch (err) {
      console.error('Error updating asset value:', err);
      setError('Failed to update investment value. Please try again.');
    } finally {
      setValueUpdateLoading(false);
    }
  };

  // If still loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading investment details...</p>
        </div>
      </div>
    );
  }

  // If there was an error or asset not found
  if (error || !asset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <a href="/investments" className="flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeft size={16} className="mr-2" />
            Back to Investments
          </a>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {error || 'Investment not found'}
          </h2>
          <p className="text-gray-400 mb-6">
            The investment you are looking for does not exist or you don't have permission to view it.
          </p>
          <a 
            href="/investments" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Back to Investments
          </a>
        </div>
      </div>
    );
  }

  // Calculate ROI for this asset
  const roi = calculateROI(asset.current_value, asset.total_investment);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and action buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <a href="/investments" className="flex items-center text-blue-400 hover:text-blue-300 mb-4 md:mb-0">
          <ArrowLeft size={16} className="mr-2" />
          Back to Investments
        </a>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => setUpdateValueModal(true)}
            className="flex items-center px-4 py-2 border border-blue-600 text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
          >
            <Calculator size={16} className="mr-2" />
            Update Value
          </button>
          
          <a 
            href={`/investments/${id}/edit`}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit size={16} className="mr-2" />
            Edit
          </a>
          
          <button 
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center px-4 py-2 border border-red-600 text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      {/* Asset overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{asset.asset_name}</h1>
          <div className="flex items-center">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 mr-3">
              {asset.assetType}
            </span>
            {asset.institution && (
              <span className="text-gray-400 text-sm">
                {asset.institution}
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Current Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(asset.current_value)}</p>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm mb-1">Initial Investment</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(asset.total_investment)}</p>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm mb-1">Return</p>
            <div className="flex items-center">
              {roi !== null ? (
                <>
                  <p className={`text-2xl font-bold mr-2 ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {roi.toFixed(2)}%
                  </p>
                  {roi >= 0 ? (
                    <TrendingUp className="text-green-400" size={20} />
                  ) : (
                    <TrendingDown className="text-red-400" size={20} />
                  )}
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-400">N/A</p>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm mb-1">Purchase Date</p>
            <p className="text-2xl font-bold text-white">{formatDate(asset.purchase_date)}</p>
          </div>
        </div>
      </div>
      
      {/* Asset details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FileText size={20} className="mr-2 text-blue-400" />
            Basic Details
          </h2>
          
          <div className="space-y-4">
            {asset.account_number && (
              <div>
                <p className="text-gray-400 text-sm">Account/Reference Number</p>
                <p className="text-white">{asset.account_number}</p>
              </div>
            )}
            
            <div>
              <p className="text-gray-400 text-sm">Purchase Price</p>
              <p className="text-white">{formatCurrency(asset.purchase_price)}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Quantity</p>
              <p className="text-white">{asset.quantity}</p>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-sm">Risk Score</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 mb-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(asset.risk_score / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-blue-400">
                {asset.risk_score}/5 - {
                  asset.risk_score === 1 ? 'Very Low Risk' :
                  asset.risk_score === 2 ? 'Low Risk' :
                  asset.risk_score === 3 ? 'Medium Risk' :
                  asset.risk_score === 4 ? 'High Risk' :
                  'Very High Risk'
                }
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Liquidity Score</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 mb-1">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(asset.liquidity_score / 5) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-green-400">
                {asset.liquidity_score}/5 - {
                  asset.liquidity_score === 1 ? 'Very Low Liquidity' :
                  asset.liquidity_score === 2 ? 'Low Liquidity' :
                  asset.liquidity_score === 3 ? 'Medium Liquidity' :
                  asset.liquidity_score === 4 ? 'High Liquidity' :
                  'Very High Liquidity'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-purple-400" />
            Timeline
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Purchase Date</p>
              <p className="text-white">{formatDate(asset.purchase_date)}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Last Updated</p>
              <p className="text-white">{formatDate(asset.updated_at)}</p>
            </div>
            
            {asset.maturity_date && (
              <div>
                <p className="text-gray-400 text-sm">Maturity Date</p>
                <p className="text-white">{formatDate(asset.maturity_date)}</p>
              </div>
            )}
            
            {asset.expectedValue && asset.maturity_date && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-gray-400 text-sm">Expected Value at Maturity</p>
                <p className="text-white">{formatCurrency(asset.expectedValue)}</p>
                
                {asset.expectedValue && asset.total_investment && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-sm">Expected Return</p>
                    <p className="text-green-400">
                      {(((asset.expectedValue - asset.total_investment) / asset.total_investment) * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Tag size={20} className="mr-2 text-yellow-400" />
            Additional Information
          </h2>
          
          <div className="space-y-4">
            {asset.tags && asset.tags.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {asset.notes && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Notes</p>
                <p className="text-white whitespace-pre-line">{asset.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Value history */}
      {history && history.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Value History</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatCurrency(entry.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.action === 'Purchase' ? 'bg-green-500/20 text-green-400' :
                        entry.action === 'ValueUpdate' ? 'bg-blue-500/20 text-blue-400' :
                        entry.action === 'Update' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{asset.asset_name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Update value modal */}
      {updateValueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Update Investment Value</h3>
            
            <form onSubmit={handleValueUpdate}>
              <div className="mb-4">
                <label htmlFor="current_value" className="block text-sm font-medium mb-2 text-white">
                  Current Value <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">₹</span>
                  </div>
                  <input
                    id="current_value"
                    type="text"
                    value={newValue}
                    onChange={(e) => {
                      // Allow only numbers and decimal point
                      if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                        setNewValue(e.target.value);
                      }
                    }}
                    className="block w-full pl-8 pr-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                              transition-colors text-white placeholder-gray-400"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="valueNotes" className="block text-sm font-medium mb-2 text-white">
                  Notes
                </label>
                <textarea
                  id="valueNotes"
                  value={valueNotes}
                  onChange={(e) => setValueNotes(e.target.value)}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                            transition-colors text-white placeholder-gray-400"
                  placeholder="Add notes about this value update..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setUpdateValueModal(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={valueUpdateLoading || !newValue}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors
                          disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {valueUpdateLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    "Update Value"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AssetDetails;

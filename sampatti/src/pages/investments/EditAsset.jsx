import React, { useState, useEffect } from 'react';
import { X, Plus, HelpCircle, ArrowLeft, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssetById, updateAsset } from '../../utils/assetService';

const EditAsset = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalAsset, setOriginalAsset] = useState(null);
  
  // Asset form data
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: '',
    institution: '',
    account_number: '',
    purchase_date: '',
    purchase_price: '',
    quantity: '',
    total_investment: '',
    current_value: '',
    maturity_date: '',
    expected_value: '',
    risk_score: '3',
    liquidity_score: '3',
    notes: '',
    tags: []
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Fetch asset data on component mount
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setIsLoading(true);
        const assetData = await getAssetById(id);
        setOriginalAsset(assetData);
        
        // Prepare data for form
        const formattedData = {
          ...assetData,
          purchase_price: assetData.purchase_price?.toString() || '',
          quantity: assetData.quantity?.toString() || '',
          total_investment: assetData.total_investment?.toString() || '',
          current_value: assetData.current_value?.toString() || '',
          expected_value: assetData.expected_value?.toString() || '',
          risk_score: assetData.risk_score?.toString() || '3',
          liquidity_score: assetData.liquidity_score?.toString() || '3',
          purchase_date: assetData.purchase_date ? new Date(assetData.purchase_date).toISOString().split('T')[0] : '',
          maturity_date: assetData.maturity_date ? new Date(assetData.maturity_date).toISOString().split('T')[0] : '',
          tags: assetData.tags || []
        };
        
        setFormData(formattedData);
      } catch (error) {
        console.error('Error fetching asset:', error);
        setError('Failed to load investment details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id]);
  
  // Asset types based on backend data model
  const asset_types = [
    'Stock',
    'MutualFund',
    'FixedDeposit',
    'RealEstate',
    'Gold',
    'Bond',
    'PPF',
    'EPF',
    'NPS',
    'Insurance',
    'Cash',
    'Other'
  ];

  // Risk and liquidity score descriptions
  const riskDescriptions = {
    '1': 'Very Low Risk',
    '2': 'Low Risk',
    '3': 'Medium Risk',
    '4': 'High Risk',
    '5': 'Very High Risk',
  };
  
  const liquidityDescriptions = {
    '1': 'Very Low (Hard to sell)',
    '2': 'Low',
    '3': 'Medium',
    '4': 'High',
    '5': 'Very High (Easily convertible to cash)',
  };

  // Calculate total investment when price or quantity changes
  useEffect(() => {
    if (formData.purchase_price && formData.quantity) {
      const price = parseFloat(formData.purchase_price);
      const qty = parseFloat(formData.quantity);
      if (!isNaN(price) && !isNaN(qty)) {
        setFormData(prev => ({
          ...prev,
          total_investment: (price * qty).toFixed(2)
        }));
      }
    }
  }, [formData.purchase_price, formData.quantity]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle number input to ensure proper formatting
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    // Allow empty or valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle tag input
  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };
  
  // Add a tag
  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  // Handle Enter key in tag input
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    
    try {
      // Format data for API
      const apiData = {
        ...formData,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : null,
        total_investment: formData.total_investment ? parseFloat(formData.total_investment) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
        expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null,
        risk_score: formData.risk_score ? parseInt(formData.risk_score) : 3,
        liquidity_score: formData.liquidity_score ? parseInt(formData.liquidity_score) : 3,
      };
      
      // Remove empty fields to avoid backend validation issues
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === '' || apiData[key] === null) {
          delete apiData[key];
        }
      });
      
      // Update the asset
      await updateAsset(id, apiData);
      
      // Navigate back to asset details page
      navigate(`/investments/${id}`, { 
        state: { message: 'Investment updated successfully' } 
      });
      
    } catch (err) {
      console.error('Asset update error:', err);
      setError(err.message || 'Failed to update investment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 mx-auto text-blue-500 mb-4" />
          <p className="text-white">Loading investment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4">
      {/* Header */}
      <div className="mb-8">
        <a href={`/investments/${id}`} className="flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Investment Details
        </a>
        <h1 className="text-2xl font-bold text-white">Edit Investment</h1>
        <p className="text-gray-400 mt-1">
          Update details for {originalAsset?.asset_name}
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset name */}
          <div>
            <label htmlFor="asset_name" className="block text-sm font-medium mb-2 text-white">
              Investment Name <span className="text-red-400">*</span>
            </label>
            <input
              id="asset_name"
              name="asset_name"
              type="text"
              value={formData.asset_name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white placeholder-gray-400"
              placeholder="e.g., HDFC Bank Fixed Deposit"
              required
            />
          </div>
          
          {/* Asset type */}
          <div>
            <label htmlFor="asset_type" className="block text-sm font-medium mb-2 text-white">
              Investment Type <span className="text-red-400">*</span>
            </label>
            <select
              id="asset_type"
              name="asset_type"
              value={formData.asset_type}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white"
              required
            >
              {asset_types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Institution */}
          <div>
            <label htmlFor="institution" className="block text-sm font-medium mb-2 text-white">
              Institution / Platform
            </label>
            <input
              id="institution"
              name="institution"
              type="text"
              value={formData.institution}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white placeholder-gray-400"
              placeholder="e.g., HDFC Bank, Zerodha, etc."
            />
          </div>
          
          {/* Account number */}
          <div>
            <label htmlFor="account_number" className="block text-sm font-medium mb-2 text-white">
              Account / Reference Number
            </label>
            <input
              id="account_number"
              name="account_number"
              type="text"
              value={formData.account_number}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white placeholder-gray-400"
              placeholder="e.g., FD12345678"
            />
          </div>
          
          {/* Purchase date */}
          <div>
            <label htmlFor="purchase_date" className="block text-sm font-medium mb-2 text-white">
              Purchase Date
            </label>
            <input
              id="purchase_date"
              name="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white"
            />
          </div>
          
          {/* Purchase price */}
          <div>
            <label htmlFor="purchase_price" className="block text-sm font-medium mb-2 text-white">
              Purchase Price <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="purchase_price"
                name="purchase_price"
                type="text"
                value={formData.purchase_price}
                onChange={handleNumberChange}
                className="block w-full pl-8 pr-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white placeholder-gray-400"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-white">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="text"
              value={formData.quantity}
              onChange={handleNumberChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white placeholder-gray-400"
              placeholder="1"
            />
          </div>
          
          {/* Total investment */}
          <div>
            <label htmlFor="total_investment" className="block text-sm font-medium mb-2 text-white">
              Total Investment <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="total_investment"
                name="total_investment"
                type="text"
                value={formData.total_investment}
                onChange={handleNumberChange}
                className="block w-full pl-8 pr-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white placeholder-gray-400"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          {/* Current value */}
          <div>
            <label htmlFor="current_value" className="block text-sm font-medium mb-2 text-white">
              Current Value <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="current_value"
                name="current_value"
                type="text"
                value={formData.current_value}
                onChange={handleNumberChange}
                className="block w-full pl-8 pr-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white placeholder-gray-400"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          {/* Maturity date (conditional based on asset type) */}
          {['FixedDeposit', 'Bond', 'PPF', 'Insurance'].includes(formData.asset_type) && (
            <div>
              <label htmlFor="maturity_date" className="block text-sm font-medium mb-2 text-white">
                Maturity Date
              </label>
              <input
                id="maturity_date"
                name="maturity_date"
                type="date"
                value={formData.maturity_date}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white"
              />
            </div>
          )}
          
          {/* Expected value at maturity (conditional) */}
          {['FixedDeposit', 'Bond', 'PPF', 'Insurance'].includes(formData.asset_type) && (
            <div>
              <label htmlFor="expected_value" className="block text-sm font-medium mb-2 text-white">
                Expected Value at Maturity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">₹</span>
                </div>
                <input
                  id="expected_value"
                  name="expected_value"
                  type="text"
                  value={formData.expected_value}
                  onChange={handleNumberChange}
                  className="block w-full pl-8 pr-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                             transition-colors text-white placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Risk and liquidity scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="risk_score" className="block text-sm font-medium mb-2 text-white">
              Risk Score
              <span className="ml-2 inline-flex items-center">
                <HelpCircle size={16} className="text-gray-400" />
              </span>
            </label>
            <div className="mt-1">
              <input
                id="risk_score"
                name="risk_score"
                type="range"
                min="1"
                max="5"
                value={formData.risk_score}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Very Low</span>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Very High</span>
              </div>
              <p className="mt-1 text-sm text-blue-400">
                {riskDescriptions[formData.risk_score]}
              </p>
            </div>
          </div>
          
          <div>
            <label htmlFor="liquidity_score" className="block text-sm font-medium mb-2 text-white">
              Liquidity Score
              <span className="ml-2 inline-flex items-center">
                <HelpCircle size={16} className="text-gray-400" />
              </span>
            </label>
            <div className="mt-1">
              <input
                id="liquidity_score"
                name="liquidity_score"
                type="range"
                min="1"
                max="5"
                value={formData.liquidity_score}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Very Low</span>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Very High</span>
              </div>
              <p className="mt-1 text-sm text-blue-400">
                {liquidityDescriptions[formData.liquidity_score]}
              </p>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        <div className="mt-6">
          <label htmlFor="notes" className="block text-sm font-medium mb-2 text-white">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
            className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       transition-colors text-white placeholder-gray-400"
            placeholder="Add any additional information about this investment..."
          ></textarea>
        </div>
        
        {/* Tags */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-white">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map(tag => (
              <div 
                key={tag} 
                className="flex items-center bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
              >
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)}
                  className="ml-2 rounded-full hover:bg-blue-500/40 p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInput}
              onKeyDown={handleTagKeyDown}
              className="flex-grow px-3 py-2 border border-gray-700 bg-gray-900 rounded-l-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                        transition-colors text-white placeholder-gray-400"
              placeholder="Add a tag (e.g., Tax-Saving, Emergency Fund)"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="flex justify-end mt-8">
          <a
            href={`/investments/${id}`}
            className="mr-4 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                     disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAsset;
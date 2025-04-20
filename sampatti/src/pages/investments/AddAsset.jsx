import React, { useState, useEffect } from 'react';
import { X, Plus, HelpCircle, ArrowLeft } from 'lucide-react';

// This component would be placed in src/pages/investments/AddAsset.jsx

const AddAsset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Asset form data
  const [formData, setFormData] = useState({
    assetName: '',
    assetType: 'Stock',
    institution: '',
    accountNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    quantity: '1',
    totalInvestment: '',
    currentValue: '',
    maturityDate: '',
    expectedValue: '',
    riskScore: '3',
    liquidityScore: '3',
    notes: '',
    tags: []
  });
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Asset types based on backend data model
  const assetTypes = [
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
    if (formData.purchasePrice && formData.quantity) {
      const price = parseFloat(formData.purchasePrice);
      const qty = parseFloat(formData.quantity);
      if (!isNaN(price) && !isNaN(qty)) {
        setFormData(prev => ({
          ...prev,
          totalInvestment: (price * qty).toFixed(2)
        }));
      }
    }
  }, [formData.purchasePrice, formData.quantity]);

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
    setIsLoading(true);
    
    try {
      // Format data for API
      const apiData = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        quantity: parseFloat(formData.quantity),
        totalInvestment: parseFloat(formData.totalInvestment),
        currentValue: parseFloat(formData.currentValue),
        expectedValue: formData.expectedValue ? parseFloat(formData.expectedValue) : 0,
        riskScore: parseInt(formData.riskScore),
        liquidityScore: parseInt(formData.liquidityScore),
      };
      
      // Remove empty fields to avoid backend validation issues
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === '' || apiData[key] === null) {
          delete apiData[key];
        }
      });
      
      // Submit data to API
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create asset');
      }
      
      // Handle success
      setSuccess(true);
      
      // Redirect to investments list after a short delay
      setTimeout(() => {
        window.location.href = '/investments';
      }, 2000);
      
    } catch (err) {
      console.error('Asset creation error:', err);
      setError(err.message || 'Failed to create asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <a href="/investments" className="flex items-center text-blue-400 hover:text-blue-300 mb-4">
          <ArrowLeft size={16} className="mr-2" />
          Back to Investments
        </a>
        <h1 className="text-2xl font-bold text-white">Add New Investment</h1>
        <p className="text-gray-400 mt-1">
          Track a new investment by filling in the details below.
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          Investment added successfully! Redirecting...
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset name */}
          <div>
            <label htmlFor="assetName" className="block text-sm font-medium mb-2 text-white">
              Investment Name <span className="text-red-400">*</span>
            </label>
            <input
              id="assetName"
              name="assetName"
              type="text"
              value={formData.assetName}
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
            <label htmlFor="assetType" className="block text-sm font-medium mb-2 text-white">
              Investment Type <span className="text-red-400">*</span>
            </label>
            <select
              id="assetType"
              name="assetType"
              value={formData.assetType}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white"
              required
            >
              {assetTypes.map(type => (
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
            <label htmlFor="accountNumber" className="block text-sm font-medium mb-2 text-white">
              Account / Reference Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white placeholder-gray-400"
              placeholder="e.g., FD12345678"
            />
          </div>
          
          {/* Purchase date */}
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2 text-white">
              Purchase Date
            </label>
            <input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white"
            />
          </div>
          
          {/* Purchase price */}
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium mb-2 text-white">
              Purchase Price <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="purchasePrice"
                name="purchasePrice"
                type="text"
                value={formData.purchasePrice}
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
            <label htmlFor="totalInvestment" className="block text-sm font-medium mb-2 text-white">
              Total Investment <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="totalInvestment"
                name="totalInvestment"
                type="text"
                value={formData.totalInvestment}
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
            <label htmlFor="currentValue" className="block text-sm font-medium mb-2 text-white">
              Current Value <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">₹</span>
              </div>
              <input
                id="currentValue"
                name="currentValue"
                type="text"
                value={formData.currentValue}
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
          {['FixedDeposit', 'Bond', 'PPF', 'Insurance'].includes(formData.assetType) && (
            <div>
              <label htmlFor="maturityDate" className="block text-sm font-medium mb-2 text-white">
                Maturity Date
              </label>
              <input
                id="maturityDate"
                name="maturityDate"
                type="date"
                value={formData.maturityDate}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white"
              />
            </div>
          )}
          
          {/* Expected value at maturity (conditional) */}
          {['FixedDeposit', 'Bond', 'PPF', 'Insurance'].includes(formData.assetType) && (
            <div>
              <label htmlFor="expectedValue" className="block text-sm font-medium mb-2 text-white">
                Expected Value at Maturity
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">₹</span>
                </div>
                <input
                  id="expectedValue"
                  name="expectedValue"
                  type="text"
                  value={formData.expectedValue}
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
            <label htmlFor="riskScore" className="block text-sm font-medium mb-2 text-white">
              Risk Score
              <span className="ml-2 inline-flex items-center">
                <HelpCircle size={16} className="text-gray-400" />
              </span>
            </label>
            <div className="mt-1">
              <input
                id="riskScore"
                name="riskScore"
                type="range"
                min="1"
                max="5"
                value={formData.riskScore}
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
                {riskDescriptions[formData.riskScore]}
              </p>
            </div>
          </div>
          
          <div>
            <label htmlFor="liquidityScore" className="block text-sm font-medium mb-2 text-white">
              Liquidity Score
              <span className="ml-2 inline-flex items-center">
                <HelpCircle size={16} className="text-gray-400" />
              </span>
            </label>
            <div className="mt-1">
              <input
                id="liquidityScore"
                name="liquidityScore"
                type="range"
                min="1"
                max="5"
                value={formData.liquidityScore}
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
                {liquidityDescriptions[formData.liquidityScore]}
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
            href="/investments"
            className="mr-4 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                     disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Investment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAsset;
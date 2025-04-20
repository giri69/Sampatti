import React, { useState, useEffect } from 'react';
import { X, Plus, HelpCircle, ArrowLeft } from 'lucide-react';

const AddAsset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'Stock',
    institution: '',
    account_number: '',
   purchase_date: '',
    purchase_price: '',
    quantity: '1',
    total_investment: '',
    current_value: '',
    last_updated: new Date().toISOString().split('T')[0],
    maturity_date: '',
    expected_value: '',
    return_rate: '',
    risk_score: '3',
    liquidity_score: '3',
    notes: '',
    tags: []
  });
  
  const [tagInput, setTagInput] = useState('');
  
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
  
  useEffect(() => {
    if (formData.purchase_price && formData.current_value && formData.total_investment) {
      const investment = parseFloat(formData.total_investment);
      const current = parseFloat(formData.current_value);
      if (!isNaN(investment) && !isNaN(current) && investment > 0) {
        const rate = ((current - investment) / investment) * 100;
        setFormData(prev => ({
          ...prev,
          return_rate: rate.toFixed(2)
        }));
      }
    }
  }, [formData.purchase_price, formData.current_value, formData.total_investment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };
  
  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const apiData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        quantity: parseFloat(formData.quantity),
        total_investment: parseFloat(formData.total_investment),
        current_value: parseFloat(formData.current_value),
        expected_value: formData.expected_value ? parseFloat(formData.expected_value) : 0,
        return_rate: formData.return_rate ? parseFloat(formData.return_rate) : 0,
        risk_score: parseInt(formData.risk_score),
        liquidity_score: parseInt(formData.liquidity_score),
        last_updated: new Date().toISOString(),
       purchase_date: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
        maturity_date: formData.maturity_date ? new Date(formData.maturity_date).toISOString() : null
      };
      
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === '' || apiData[key] === null) {
          delete apiData[key];
        }
      });
      
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
      
      setSuccess(true);
      
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
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          Investment added successfully! Redirecting...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          
          <div>
            <label htmlFor="return_rate" className="block text-sm font-medium mb-2 text-white">
              Return Rate (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">%</span>
              </div>
              <input
                id="return_rate"
                name="return_rate"
                type="text"
                value={formData.return_rate}
                onChange={handleNumberChange}
                className="block w-full px-3 pr-8 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors text-white placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="last_updated" className="block text-sm font-medium mb-2 text-white">
              Last Updated
            </label>
            <input
              id="last_updated"
              name="last_updated"
              type="date"
              value={formData.last_updated}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         transition-colors text-white"
            />
          </div>
        </div>
        
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
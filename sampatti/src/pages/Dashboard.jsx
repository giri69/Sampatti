import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart, PieChart, TrendingUp, AlertTriangle, Clock, Plus, CreditCard, DollarSign, Home, LineChart } from 'lucide-react';
import { getDashboardSummary, getAlerts } from '../utils/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getDashboardSummary();
        setPortfolioData(data);
        
        const alertsData = await getAlerts();
        setAlerts(alertsData.slice(0, 3)); // Only show top 3 alerts
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
        <h3 className="font-medium mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const mockPortfolio = {
    total_value: 8280200,
    total_investment: 7500000,
    assets_by_type: {
      "Stocks": 845200,
      "Mutual Funds": 585000,
      "Fixed Deposits": 350000,
      "Real Estate": 6500000
    },
    asset_count: 15,
    average_return: 10.5,
    average_risk_score: 3.2,
    upcoming_maturities: [
      {
        id: "1",
        asset_name: "SBI Fixed Deposit",
        maturity_date: "2025-04-25",
        expected_value: 200000
      }
    ],
    last_updated: "2025-04-20T10:30:00Z"
  };

  // Use mock data for initial development, replace with actual data later
  const portfolioSummary = portfolioData || mockPortfolio;
  
  // Calculate the total return in rupees
  const totalReturnValue = portfolioSummary.total_value - portfolioSummary.total_investment;
  const isPositiveReturn = totalReturnValue >= 0;
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate allocation percentages for the chart
  const assetAllocation = Object.entries(portfolioSummary.assets_by_type).map(([type, value]) => ({
    type,
    value,
    percentage: Math.round((value / portfolioSummary.total_value) * 100)
  }));
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Welcome, {currentUser?.name || 'Investor'}</h1>
          <p className="text-gray-400">Here's a summary of your investment portfolio</p>
        </div>
        
        <Link to="/investments/add" className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors mt-4 md:mt-0">
          <Plus size={18} className="mr-2" />
          Add Investment
        </Link>
      </div>
      
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Portfolio Value</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(portfolioSummary.total_value)}</h3>
            </div>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className={`text-sm ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`}>
              {isPositiveReturn ? '+' : ''}{formatCurrency(totalReturnValue)} ({portfolioSummary.average_return.toFixed(1)}%)
            </span>
            <TrendingUp size={14} className={`ml-1 ${isPositiveReturn ? 'text-green-400' : 'text-red-400'}`} />
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Investment</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(portfolioSummary.total_investment)}</h3>
            </div>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CreditCard size={20} className="text-green-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Across {portfolioSummary.asset_count} investments
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Largest Allocation</p>
              <h3 className="text-2xl font-bold text-white">Real Estate</h3>
            </div>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Home size={20} className="text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {Math.round((portfolioSummary.assets_by_type["Real Estate"] / portfolioSummary.total_value) * 100)}% of portfolio
          </div>
        </div>
        
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Average Risk Score</p>
              <h3 className="text-2xl font-bold text-white">{portfolioSummary.average_risk_score.toFixed(1)}/5</h3>
            </div>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <LineChart size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Moderate risk level
          </div>
        </div>
      </div>
      
      {/* Middle Section - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Allocation Chart */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 col-span-2">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium text-white">Asset Allocation</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 mb-6 md:mb-0">
                {/* Chart would go here */}
                <div className="flex items-center justify-center py-8">
                  <div className="relative h-48 w-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{formatCurrency(portfolioSummary.total_value)}</span>
                    </div>
                    {/* This is a placeholder for the actual chart - would use Recharts in real implementation */}
                    <svg viewBox="0 0 100 100" className="h-48 w-48">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="20" strokeDasharray="78.5 172.7" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="20" strokeDasharray="45.2 204" strokeDashoffset="-78.5" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="20" strokeDasharray="31.4 221.8" strokeDashoffset="-123.7" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="20" strokeDasharray="100.5 151.3" strokeDashoffset="-154.1" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h4 className="text-sm text-gray-400 mb-3">Distribution</h4>
                <div className="space-y-3">
                  {assetAllocation.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-yellow-500' : 
                          'bg-purple-500'
                        }`}></div>
                        <span className="text-gray-300">{asset.type}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{asset.percentage}%</span>
                        <span className="text-white">{formatCurrency(asset.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* High Priority Alerts */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-white">Important Alerts</h3>
            <Link to="/alerts" className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="p-2">
            {portfolioSummary.upcoming_maturities.length > 0 ? (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg m-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-red-400">Upcoming Maturity</h4>
                  <div className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                    High Priority
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Your {portfolioSummary.upcoming_maturities[0].asset_name} of {formatCurrency(portfolioSummary.upcoming_maturities[0].expected_value)} is maturing on {formatDate(portfolioSummary.upcoming_maturities[0].maturity_date)}.
                </p>
                <Link to={`/investments/${portfolioSummary.upcoming_maturities[0].id}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center mt-1">
                  View Details
                </Link>
              </div>
            ) : null}
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg m-2">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-yellow-400">Portfolio Rebalancing</h4>
                <div className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                  Medium Priority
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-1">
                Your Real Estate allocation is {Math.round((portfolioSummary.assets_by_type["Real Estate"] / portfolioSummary.total_value) * 100)}% of portfolio. Consider diversifying.
              </p>
              <Link to="/insights/rebalancing" className="text-xs text-blue-400 hover:text-blue-300 flex items-center mt-1">
                View Suggestions
              </Link>
            </div>
            
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg m-2">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-green-400">Document Reminder</h4>
                <div className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                  Information
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-1">
                You haven't uploaded any documents for your recent stock purchases.
              </p>
              <Link to="/documents/upload" className="text-xs text-blue-400 hover:text-blue-300 flex items-center mt-1">
                Upload Documents
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Recent Activity and Nominees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-white">Recent Activity</h3>
            <Link to="/history" className="text-sm text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="p-3">
            <div className="space-y-3">
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp size={16} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Stock Purchase</p>
                    <span className="text-xs text-gray-400">6 hours ago</span>
                  </div>
                  <p className="text-xs text-gray-400">Added 100 shares of Infosys at ₹1,850 per share</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-green-500/20 rounded-lg">
                  <CreditCard size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">FD Investment</p>
                    <span className="text-xs text-gray-400">2 days ago</span>
                  </div>
                  <p className="text-xs text-gray-400">Created new HDFC Bank Fixed Deposit of ₹2,00,000</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-purple-500/20 rounded-lg">
                  <BarChart size={16} className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Value Update</p>
                    <span className="text-xs text-gray-400">5 days ago</span>
                  </div>
                  <p className="text-xs text-gray-400">Updated TCS stock value to ₹3,950 per share</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle size={16} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Nominee Added</p>
                    <span className="text-xs text-gray-400">1 week ago</span>
                  </div>
                  <p className="text-xs text-gray-400">Added Rahul Sharma as primary nominee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-white">Upcoming Events</h3>
            <Link to="/calendar" className="text-sm text-blue-400 hover:text-blue-300">
              View Calendar
            </Link>
          </div>
          <div className="p-3">
            <div className="space-y-3">
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-red-500/20 rounded-lg">
                  <Clock size={16} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">SBI FD Maturity</p>
                    <span className="text-xs text-white px-2 py-0.5 bg-red-500/30 rounded">5 days left</span>
                  </div>
                  <p className="text-xs text-gray-400">₹2,00,000 will be credited to your account</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-blue-500/20 rounded-lg">
                  <BarChart size={16} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Quarterly Results</p>
                    <span className="text-xs text-white px-2 py-0.5 bg-blue-500/30 rounded">12 days left</span>
                  </div>
                  <p className="text-xs text-gray-400">TCS & Infosys will announce Q1 results</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-green-500/20 rounded-lg">
                  <PieChart size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Mutual Fund SIP</p>
                    <span className="text-xs text-white px-2 py-0.5 bg-green-500/30 rounded">15 days left</span>
                  </div>
                  <p className="text-xs text-gray-400">₹25,000 will be debited for monthly SIP</p>
                </div>
              </div>
              
              <div className="flex p-2 hover:bg-gray-700/50 rounded-lg">
                <div className="mr-3 p-2 bg-yellow-500/20 rounded-lg">
                  <Home size={16} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-white">Property Tax Due</p>
                    <span className="text-xs text-white px-2 py-0.5 bg-yellow-500/30 rounded">30 days left</span>
                  </div>
                  <p className="text-xs text-gray-400">Annual property tax payment of ₹45,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Last Updated Info */}
      <div className="text-xs text-gray-500 text-right">
        Last updated: {formatDate(portfolioSummary.last_updated)}
      </div>
    </div>
  );
};

export default Dashboard;
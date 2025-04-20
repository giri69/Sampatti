import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, PieChart, TrendingUp, AlertTriangle, Clock, Plus, 
  CreditCard, DollarSign, Home, LineChart, Loader
} from 'lucide-react';
import { getDashboardSummary, getAlerts } from '../utils/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [hasInvestments, setHasInvestments] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch portfolio summary data
        const data = await getDashboardSummary();
        setPortfolioData(data);
        
        // Check if user has any investments
        setHasInvestments(data.asset_count > 0);
        
        // Fetch alerts
        try {
          const alertsData = await getAlerts();
          setAlerts(alertsData.slice(0, 3)); // Only show top 3 alerts
        } catch (alertError) {
          console.error('Failed to load alerts:', alertError);
          // Don't set main error - alerts are secondary
          setAlerts([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        // Set empty portfolio data to prevent null reference errors
        setPortfolioData({
          total_value: 0,
          total_investment: 0,
          assets_by_type: {},
          asset_count: 0,
          average_return: 0,
          average_risk_score: 0,
          upcoming_maturities: [],
          last_updated: new Date().toISOString()
        });
        setHasInvestments(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'N/A';
    }
  };

  // Empty state component for no investments
  const EmptyState = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <PieChart size={28} className="text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">No Investments Found</h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        You haven't added any investments yet. Start tracking your investments to see detailed insights here.
      </p>
      <Link 
        to="/investments/add" 
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={18} className="mr-2" />
        Add Your First Investment
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader size={36} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !hasInvestments) {
    return (
      <div>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-5 text-red-400 mb-6">
          <h3 className="font-medium mb-2 flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            Error Loading Dashboard
          </h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
        <EmptyState />
      </div>
    );
  }

  // Use actual data or empty portfolio data as fallback
  const portfolioSummary = portfolioData || {
    total_value: 0,
    total_investment: 0,
    assets_by_type: {},
    asset_count: 0,
    average_return: 0,
    average_risk_score: 0,
    upcoming_maturities: [],
    last_updated: new Date().toISOString()
  };
  
  // Calculate the total return in rupees
  const totalReturnValue = portfolioSummary.total_value - portfolioSummary.total_investment;
  const isPositiveReturn = totalReturnValue >= 0;
  
  // Calculate allocation percentages for the chart
  const assetAllocation = Object.entries(portfolioSummary.assets_by_type || {}).map(([type, value]) => ({
    type,
    value,
    percentage: Math.round((value / Math.max(portfolioSummary.total_value, 1)) * 100)
  }));

  // If no investments found, display empty state
  if (!hasInvestments) {
    return <EmptyState />;
  }

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
      
      {/* Error message if any */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-6">
          <h3 className="font-medium mb-2 flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            Warning
          </h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}
      
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
              {isPositiveReturn ? '+' : ''}{formatCurrency(totalReturnValue)} ({portfolioSummary.average_return?.toFixed(1) || 0}%)
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
        
        {/* Only show largest allocation if there are assets */}
        {assetAllocation.length > 0 ? (
          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Largest Allocation</p>
                <h3 className="text-2xl font-bold text-white">{assetAllocation[0]?.type || 'None'}</h3>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Home size={20} className="text-yellow-400" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {assetAllocation[0]?.percentage || 0}% of portfolio
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Largest Allocation</p>
                <h3 className="text-2xl font-bold text-white">None</h3>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Home size={20} className="text-yellow-400" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              No allocations yet
            </div>
          </div>
        )}
        
        <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Average Risk Score</p>
              <h3 className="text-2xl font-bold text-white">{portfolioSummary.average_risk_score?.toFixed(1) || '0'}/5</h3>
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
            {assetAllocation.length > 0 ? (
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
                        {assetAllocation.map((asset, index) => {
                          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
                          const offset = index > 0 
                            ? assetAllocation.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0) * 2.51 
                            : 0;
                          return (
                            <circle 
                              key={asset.type}
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="transparent" 
                              stroke={colors[index % colors.length]} 
                              strokeWidth="20" 
                              strokeDasharray={`${asset.percentage * 2.51} ${251 - asset.percentage * 2.51}`} 
                              strokeDashoffset={-offset}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2">
                  <h4 className="text-sm text-gray-400 mb-3">Distribution</h4>
                  <div className="space-y-3">
                    {assetAllocation.map((asset, index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${colors[index % colors.length]}`}></div>
                            <span className="text-gray-300">{asset.type}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-2">{asset.percentage}%</span>
                            <span className="text-white">{formatCurrency(asset.value)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PieChart size={24} className="text-gray-500" />
                </div>
                <p className="text-gray-400 mb-3">No asset allocation data available</p>
                <Link 
                  to="/investments/add" 
                  className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
                >
                  <Plus size={16} className="mr-1" />
                  Add an investment
                </Link>
              </div>
            )}
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
            {portfolioSummary.upcoming_maturities && portfolioSummary.upcoming_maturities.length > 0 ? (
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
            
            {alerts && alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div 
                  key={alert.id || index} 
                  className={`p-3 ${
                    alert.severity === 'High' ? 'bg-red-500/10 border-red-500/30' :
                    alert.severity === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-green-500/10 border-green-500/30'
                  } border rounded-lg m-2`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-medium ${
                      alert.severity === 'High' ? 'text-red-400' :
                      alert.severity === 'Medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{alert.alert_type}</h4>
                    <div className={`px-2 py-0.5 ${
                      alert.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    } rounded text-xs`}>
                      {alert.severity} Priority
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">
                    {alert.message}
                  </p>
                  {alert.action_link && (
                    <Link to={alert.action_link} className="text-xs text-blue-400 hover:text-blue-300 flex items-center mt-1">
                      {alert.action_text || 'View Details'}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-700/30 border border-gray-700 rounded-lg m-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-300">No Alerts</h4>
                </div>
                <p className="text-sm text-gray-400 mb-1">
                  You don't have any active alerts at the moment.
                </p>
              </div>
            )}
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
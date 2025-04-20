import { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle, Clock, Filter, Search, 
  ChevronDown, ChevronUp, ExternalLink, X, Eye, Loader,
  ArrowRight, AlertOctagon, Shield, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAlerts, markAlertAsRead, dismissAlert } from '../utils/api';

const Alerts = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', 
    type: 'all',   
    severity: 'all' 
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getAlerts();
        setAlerts(data);
        setFilteredAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts:', err);
        setError('Failed to load alerts. Please try again.');
        setAlerts([]);
        setFilteredAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAlerts();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    const applyFilters = () => {
      let result = [...alerts];
      
      // Apply status filter
      if (filters.status !== 'all') {
        result = result.filter(alert => 
          filters.status === 'read' ? alert.is_read : !alert.is_read
        );
      }
      
      // Apply type filter
      if (filters.type !== 'all') {
        result = result.filter(alert => alert.alert_type.toLowerCase() === filters.type);
      }
      
      // Apply severity filter
      if (filters.severity !== 'all') {
        result = result.filter(alert => alert.severity.toLowerCase() === filters.severity.toLowerCase());
      }
      
      // Apply search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        result = result.filter(alert => 
          alert.alert_type.toLowerCase().includes(term) || 
          alert.message.toLowerCase().includes(term)
        );
      }
      
      setFilteredAlerts(result);
    };
    
    applyFilters();
  }, [filters, searchTerm, alerts]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      type: 'all',
      severity: 'all'
    });
    setSearchTerm('');
  };

  // Handle alert actions
  const handleMarkAsRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        )
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
      setError('Failed to update alert. Please try again.');
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      await dismissAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
      setError('Failed to dismiss alert. Please try again.');
    }
  };

  // View alert details
  const viewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    if (!alert.is_read) {
      handleMarkAsRead(alert.id);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper for alert icon
  const getAlertIcon = (type, severity) => {
    switch (type.toLowerCase()) {
      case 'maturity':
        return <Clock size={20} className={getSeverityColor(severity)} />;
      case 'price alert':
        return <AlertOctagon size={20} className={getSeverityColor(severity)} />;
      case 'security':
        return <Shield size={20} className={getSeverityColor(severity)} />;
      case 'news':
        return <Info size={20} className={getSeverityColor(severity)} />;
      default:
        return <AlertTriangle size={20} className={getSeverityColor(severity)} />;
    }
  };

  // Helper for severity color
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-blue-400';
    }
  };

  // Get alert type options based on existing alerts
  const getAlertTypes = () => {
    const types = new Set(alerts.map(alert => alert.alert_type.toLowerCase()));
    return Array.from(types);
  };

  // Alert severity badge
  const SeverityBadge = ({ severity }) => {
    const badges = {
      high: 'bg-red-500/20 text-red-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      low: 'bg-green-500/20 text-green-400'
    };
    
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${badges[severity.toLowerCase()] || badges.medium}`}>
        {severity}
      </span>
    );
  };

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader size={36} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Alerts</h1>
          <p className="text-gray-400">Stay updated with important notifications about your investments</p>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-6">
          <h3 className="font-medium mb-2 flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            Error
          </h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* Search and Filter Bar */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            <Filter size={18} className="mr-2" />
            Filters
            {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
          </button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="p-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                >
                  <option value="all">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                >
                  <option value="all">All Types</option>
                  {getAlertTypes().map(type => (
                    <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange('severity', e.target.value)}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                >
                  <option value="all">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={resetFilters}
                className="text-sm text-gray-400 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alert List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 md:col-span-1">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-white">
              Alerts {filteredAlerts.length > 0 ? `(${filteredAlerts.length})` : ''}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-700 max-h-[calc(100vh-320px)] overflow-y-auto">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  onClick={() => viewAlertDetails(alert)}
                  className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                    selectedAlert?.id === alert.id ? 'bg-gray-700' : ''
                  } ${!alert.is_read ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-start mb-2">
                    <div className="p-1.5 rounded-full mr-3">
                      {getAlertIcon(alert.alert_type, alert.severity)}
                    </div>
                    <div className="flex-grow">
                      <h4 className={`font-medium ${!alert.is_read ? 'text-white' : 'text-gray-300'}`}>
                        {alert.alert_type}
                      </h4>
                      <p className="text-gray-400 text-sm truncate">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <SeverityBadge severity={alert.severity} />
                          {!alert.is_read && (
                            <span className="ml-2 bg-blue-500 h-2 w-2 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="text-gray-500" />
                </div>
                <p className="text-gray-400 mb-1">No alerts found</p>
                <p className="text-sm text-gray-500">
                  {alerts.length > 0 ? 'Try changing your filters' : 'You have no active alerts at the moment'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Alert Details */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 md:col-span-2">
          {selectedAlert ? (
            <>
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-white flex items-center">
                  {getAlertIcon(selectedAlert.alert_type, selectedAlert.severity)}
                  <span className="ml-2">{selectedAlert.alert_type}</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDismissAlert(selectedAlert.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Dismiss Alert"
                  >
                    <X size={18} className="text-red-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between mb-4">
                  <SeverityBadge severity={selectedAlert.severity} />
                  <span className="text-sm text-gray-400">
                    {formatDate(selectedAlert.timestamp)}
                  </span>
                </div>
                
                <div className={`p-4 rounded-lg mb-6 ${
                  selectedAlert.severity === 'High' ? 'bg-red-500/10' :
                  selectedAlert.severity === 'Medium' ? 'bg-yellow-500/10' :
                  'bg-green-500/10'
                }`}>
                  <h4 className="text-lg font-medium text-white mb-2">
                    {selectedAlert.title || selectedAlert.alert_type}
                  </h4>
                  <p className="text-gray-300 whitespace-pre-line">
                    {selectedAlert.message}
                  </p>
                </div>
                
                {selectedAlert.details && (
                  <div className="mb-6">
                    <h5 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Details</h5>
                    <div className="bg-gray-700/50 rounded-lg p-4 text-gray-300">
                      <p className="whitespace-pre-line">{selectedAlert.details}</p>
                    </div>
                  </div>
                )}
                
                {selectedAlert.related_asset && (
                  <div className="mb-6">
                    <h5 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Related Investment</h5>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h6 className="text-white font-medium">{selectedAlert.related_asset.name}</h6>
                          <p className="text-gray-400 text-sm">{selectedAlert.related_asset.type}</p>
                        </div>
                        <a 
                          href={`/investments/${selectedAlert.related_asset.id}`}
                          className="flex items-center text-blue-400 hover:text-blue-300"
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedAlert.recommended_actions && (
                  <div>
                    <h5 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Recommended Actions</h5>
                    <div className="space-y-3">
                      {selectedAlert.recommended_actions.map((action, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="p-1.5 bg-blue-500/20 rounded-full mr-3">
                              <CheckCircle size={16} className="text-blue-400" />
                            </div>
                            <div>
                              <h6 className="text-white font-medium mb-1">{action.title}</h6>
                              <p className="text-gray-400 text-sm">{action.description}</p>
                              
                              {action.link && (
                                <a 
                                  href={action.link}
                                  className="flex items-center text-blue-400 hover:text-blue-300 mt-2 text-sm"
                                >
                                  {action.link_text || 'Take Action'}
                                  <ArrowRight size={14} className="ml-1" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedAlert.external_link && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <a 
                      href={selectedAlert.external_link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      {selectedAlert.external_link.text || 'Learn More'}
                    </a>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Alert Selected</h3>
                <p className="text-gray-400 mb-4">
                  Select an alert from the list to view its details
                </p>
                {filteredAlerts.length === 0 && alerts.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
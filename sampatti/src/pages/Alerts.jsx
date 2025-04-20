// src/pages/Alerts.jsx
import { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, Filter, Search, 
  CheckCircle, Clock, ArrowRight  
} from 'lucide-react';
import { getAlerts, markAlertAsRead } from '../utils/api';

// Import common components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';

// Alert Item component
const AlertItem = ({ alert, onClick, isSelected }) => {
  // Get severity styles
  const getSeverityStyles = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return {
          container: 'border-red-500/30',
          badge: 'bg-red-500/20 text-red-400',
          icon: <AlertTriangle className="text-red-400" size={20} />
        };
      case 'medium':
        return {
          container: 'border-yellow-500/30',
          badge: 'bg-yellow-500/20 text-yellow-400',
          icon: <AlertTriangle className="text-yellow-400" size={20} />
        };
      default:
        return {
          container: 'border-green-500/30',
          badge: 'bg-green-500/20 text-green-400',
          icon: <CheckCircle className="text-green-400" size={20} />
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const styles = getSeverityStyles(alert.severity);
  
  return (
    <div 
      className={`p-4 ${isSelected ? 'bg-gray-700' : 'hover:bg-gray-700/50'} cursor-pointer transition-colors ${
        !alert.is_read ? 'border-l-4 border-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className="mr-3">
          {styles.icon}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-medium ${!alert.is_read ? 'text-white' : 'text-gray-300'}`}>
              {alert.alert_type}
            </h4>
            <span className={`px-2 py-0.5 text-xs rounded-full ${styles.badge}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">{alert.message}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {formatDate(alert.created_at)}
            </span>
            {!alert.is_read && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert Detail component
const AlertDetail = ({ alert, onDismiss }) => {
  if (!alert) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div>
          <Bell size={48} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Alert Selected</h3>
          <p className="text-gray-400">
            Select an alert from the list to view details
          </p>
        </div>
      </div>
    );
  }
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get severity styles
  const getSeverityBackground = (severity) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-500/10';
      case 'medium': return 'bg-yellow-500/10';
      default: return 'bg-green-500/10';
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between mb-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            alert.severity === 'High' ? 'bg-red-500/20 text-red-400' :
            alert.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            {alert.severity} Priority
          </span>
          <span className="text-sm text-gray-400">
            {formatDate(alert.created_at)}
          </span>
        </div>
        
        <div className={`p-4 rounded-lg mb-6 ${getSeverityBackground(alert.severity)}`}>
          <h3 className="text-xl font-medium text-white mb-2">
            {alert.alert_type}
          </h3>
          <p className="text-gray-300 whitespace-pre-line">
            {alert.message}
          </p>
        </div>
        
        {alert.actions && alert.actions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
              Recommended Actions
            </h4>
            <div className="space-y-3">
              {alert.actions.map((action, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle size={16} className="text-blue-400 mr-2" />
                    <h5 className="font-medium text-white">{action.action_type}</h5>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{action.description}</p>
                  {!action.completed && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="mt-2"
                      icon={<ArrowRight size={14} />}
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {alert.asset_id && (
          <div>
            <h4 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
              Related Asset
            </h4>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium text-white">View Asset Details</h5>
                  <p className="text-sm text-gray-400">Check the associated investment</p>
                </div>
                <Button
                  as="a"
                  href={`/investments/${alert.asset_id}`}
                  variant="secondary"
                  size="sm"
                >
                  View Asset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Alerts component
const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all'
  });
  
  // Load alerts on component mount
  useEffect(() => {
    const loadAlerts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getAlerts(true); // Include read alerts
        setAlerts(data);
        setFilteredAlerts(data);
        
        // Select the first unread alert if available
        const unreadAlert = data.find(alert => !alert.is_read);
        if (unreadAlert) {
          setSelectedAlert(unreadAlert);
        } else if (data.length > 0) {
          setSelectedAlert(data[0]);
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
        setError('Failed to load alerts. Please try again.');
        setAlerts([]);
        setFilteredAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAlerts();
  }, []);
  
  // Apply filters when search term or filters change
  useEffect(() => {
    let result = [...alerts];
    
    // Apply status filter
    if (filters.status !== 'all') {
      const isRead = filters.status === 'read';
      result = result.filter(alert => alert.is_read === isRead);
    }
    
    // Apply severity filter
    if (filters.severity !== 'all') {
      result = result.filter(alert => 
        alert.severity.toLowerCase() === filters.severity.toLowerCase()
      );
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(alert => 
        alert.alert_type.toLowerCase().includes(term) ||
        alert.message.toLowerCase().includes(term)
      );
    }
    
    setFilteredAlerts(result);
    
    // Update selected alert if it's filtered out
    if (selectedAlert && !result.some(alert => alert.id === selectedAlert.id)) {
      setSelectedAlert(result.length > 0 ? result[0] : null);
    }
  }, [alerts, searchTerm, filters]);
  
  // Handle alert selection
  const handleSelectAlert = async (alert) => {
    setSelectedAlert(alert);
    
    // Mark as read if not already
    if (!alert.is_read) {
      try {
        await markAlertAsRead(alert.id);
        
        // Update local state
        setAlerts(prevAlerts => 
          prevAlerts.map(a => 
            a.id === alert.id ? { ...a, is_read: true } : a
          )
        );
      } catch (err) {
        console.error('Error marking alert as read:', err);
      }
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      status: 'all',
      severity: 'all'
    });
  };
  
  if (isLoading) {
    return <LoadingState message="Loading alerts..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Alerts</h1>
          <p className="text-gray-400">Stay updated with important notifications about your investments</p>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
      
      {/* Filter bar */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-gray-500" />}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Alerts</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            
            <button
              onClick={resetFilters}
              className="md:self-end px-3 py-1 text-blue-400 hover:text-blue-300"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>
      
      {/* Main content split view */}
      {alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell size={28} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Alerts</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            You don't have any alerts at the moment. Alerts will appear here when there are updates 
            about your investments.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Alert List */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-medium text-white">
                Alerts {filteredAlerts.length > 0 ? `(${filteredAlerts.length})` : ''}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-700 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map(alert => (
                  <AlertItem 
                    key={alert.id} 
                    alert={alert}
                    onClick={() => handleSelectAlert(alert)}
                    isSelected={selectedAlert && selectedAlert.id === alert.id}
                  />
                ))
              ) : (
                <div className="p-6 text-center">
                  <Clock size={24} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">No alerts found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {alerts.length > 0 
                      ? 'Try changing your filters' 
                      : 'You have no alerts at the moment'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Alert Detail */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 md:col-span-2">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-medium text-white">Alert Details</h3>
            </div>
            
            <AlertDetail 
              alert={selectedAlert}
              onDismiss={() => {
                // Would implement dismiss functionality here
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
// src/pages/Nominees.jsx - Enhanced with Connected Assets
import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Phone, Shield, Eye, Edit, Trash2, 
  ChevronRight, Search, AlertTriangle, Clock, Check, Send,
  FileText, PieChart, ExternalLink
} from 'lucide-react';
import { 
  getNominees, createNominee, updateNominee, deleteNominee, 
  sendNomineeInvitation, getNomineeAccessLogs, getAssets
} from '../utils/api';

// Import common components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Input from '../components/common/Input';

// Access Level Badge component
const AccessLevelBadge = ({ level }) => {
  const colors = {
    'Full': 'bg-green-500/20 text-green-400',
    'Limited': 'bg-blue-500/20 text-blue-400',
    'DocumentsOnly': 'bg-yellow-500/20 text-yellow-400'
  };

  const labels = {
    'Full': 'Full Access',
    'Limited': 'Limited Access',
    'DocumentsOnly': 'Documents Only'
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[level] || 'bg-gray-500/20 text-gray-400'}`}>
      {labels[level] || level}
    </span>
  );
};

// Status Badge component
const StatusBadge = ({ status }) => {
  const colors = {
    'Active': 'bg-green-500/20 text-green-400',
    'Pending': 'bg-yellow-500/20 text-yellow-400',
    'Revoked': 'bg-red-500/20 text-red-400'
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
};

// Empty State component
const EmptyState = ({ onAddNominee }) => (
  <Card className="p-8 text-center">
    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Users size={28} className="text-blue-400" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-3">No Nominees Added</h2>
    <p className="text-gray-400 mb-6 max-w-md mx-auto">
      You haven't added any nominees yet. Nominees are trusted individuals who can access your investment details in case of emergencies.
    </p>
    <Button
      icon={<UserPlus size={18} />}
      onClick={onAddNominee}
    >
      Add Your First Nominee
    </Button>
  </Card>
);

// Nominee Form Modal
const NomineeFormModal = ({ isOpen, onClose, onSubmit, editingNominee = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    relationship: '',
    access_level: 'Limited'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Initialize form data when editing a nominee
  useEffect(() => {
    if (editingNominee) {
      setFormData({
        name: editingNominee.name || '',
        email: editingNominee.email || '',
        phone_number: editingNominee.phone_number || '',
        relationship: editingNominee.relationship || '',
        access_level: editingNominee.access_level || 'Limited'
      });
    } else {
      // Reset form for new nominee
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        relationship: '',
        access_level: 'Limited'
      });
    }
    
    setError('');
  }, [editingNominee, isOpen]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onSubmit(formData, editingNominee?.id);
      onClose();
    } catch (err) {
      console.error('Nominee form error:', err);
      setError(err.message || 'Failed to save nominee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {editingNominee ? 'Edit Nominee' : 'Add Nominee'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>
        
        {error && (
          <div className="px-6 pt-5">
            <ErrorState message={error} />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter nominee's full name"
            icon={<Users size={18} className="text-gray-500" />}
            required
            disabled={isLoading}
          />
          
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter nominee's email"
            icon={<Mail size={18} className="text-gray-500" />}
            required
            disabled={isLoading || (editingNominee !== null)}
            hint={editingNominee ? "Email cannot be changed" : ""}
          />
          
          <Input
            label="Phone Number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="Enter nominee's phone number"
            icon={<Phone size={18} className="text-gray-500" />}
            disabled={isLoading}
          />
          
          <Input
            label="Relationship"
            name="relationship"
            value={formData.relationship}
            onChange={handleChange}
            placeholder="e.g., Son, Daughter, Spouse"
            disabled={isLoading}
          />
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Access Level <span className="text-red-400">*</span>
            </label>
            <select
              name="access_level"
              value={formData.access_level}
              onChange={handleChange}
              className="block w-full px-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white"
              disabled={isLoading}
              required
            >
              <option value="DocumentsOnly">Documents Only</option>
              <option value="Limited">Limited Access</option>
              <option value="Full">Full Access</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.access_level === 'Full' 
                ? 'Full Access: Nominee can view all details including assets, documents, and summary data'
                : formData.access_level === 'Limited'
                ? 'Limited Access: Nominee can view basic asset information and selected documents'
                : 'Documents Only: Nominee can only access documents marked as accessible'}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-5">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
            >
              {editingNominee ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Nominee Detail Modal with Connected Assets
const NomineeDetailModal = ({ nominee, isOpen, onClose, onEdit, onDelete, onSendInvite, assets = [] }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  
  // Filter assets based on nominee's access level
  const accessibleAssets = assets.filter(asset => {
    if (nominee?.access_level === 'Full') {
      return true; // Full access can see all assets
    } else if (nominee?.access_level === 'Limited') {
      // Limited access can see basic assets but not sensitive ones
      return !asset.tags?.includes('Sensitive');
    }
    return false; // Documents Only can't see assets
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Handle sending invitation
  const handleSendInvite = async () => {
    setIsSending(true);
    setSendError('');
    setInviteCode('');
    
    try {
      const code = await onSendInvite(nominee.id);
      setInviteCode(code);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setSendError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  if (!isOpen || !nominee) return null;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Users size={20} className="mr-2 text-blue-400" />
            Nominee Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Left sidebar with nominee info */}
          <div className="p-6 border-r border-gray-700">
            <div className="mb-6 flex items-center justify-between">
              <StatusBadge status={nominee.status} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Edit size={16} />}
                  onClick={() => {
                    onClose();
                    onEdit(nominee);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<Trash2 size={16} />}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this nominee? This action cannot be undone.')) {
                      onDelete(nominee.id);
                      onClose();
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{nominee.name}</h2>
            <div className="text-blue-400 mb-4">{nominee.relationship}</div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center mb-3">
                  <Mail size={18} className="text-blue-400 mr-2" />
                  <h4 className="text-white font-medium">Contact Information</h4>
                </div>
                <div className="grid grid-cols-1 gap-y-2">
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">{nominee.email}</p>
                  </div>
                  {nominee.phone_number && (
                    <div>
                      <p className="text-gray-400 text-sm">Phone</p>
                      <p className="text-white">{nominee.phone_number}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-gray-700/30 rounded-lg">
                <div className="flex items-center mb-3">
                  <Shield size={18} className="text-green-400 mr-2" />
                  <h4 className="text-white font-medium">Access Details</h4>
                </div>
                <div className="grid grid-cols-1 gap-y-2">
                  <div>
                    <p className="text-gray-400 text-sm">Access Level</p>
                    <div className="flex items-center">
                      <AccessLevelBadge level={nominee.access_level} />
                      {nominee.access_level === 'Full' && (
                        <span className="text-gray-400 text-xs ml-2">(All data accessible)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={
                      nominee.status === 'Active' ? 'text-green-400' : 
                      nominee.status === 'Pending' ? 'text-yellow-400' : 
                      'text-red-400'
                    }>
                      {nominee.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Last Access</p>
                    <p className="text-white">{formatDate(nominee.last_access_date)}</p>
                  </div>
                </div>
              </div>
              
              {/* Invite button for pending nominees */}
              {nominee.status === 'Pending' && (
                <div className="mt-4">
                  <Button
                    className="w-full"
                    variant="primary"
                    icon={<Send size={18} />}
                    onClick={handleSendInvite}
                    isLoading={isSending}
                    disabled={isSending}
                  >
                    Send Invitation
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side tabs */}
          <div className="col-span-2">
            {/* Tab navigation */}
            <div className="flex border-b border-gray-700">
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'details' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'assets' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('assets')}
              >
                Accessible Assets {accessibleAssets.length > 0 ? `(${accessibleAssets.length})` : ''}
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {/* Details tab */}
              {activeTab === 'details' && (
                <div>
                  {/* Invite Code Display */}
                  {inviteCode && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start">
                        <Check size={18} className="text-green-400 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-white font-medium">Invitation Sent!</h4>
                          <p className="text-gray-300 text-sm mb-2">
                            Share this emergency access code with {nominee.name}:
                          </p>
                          <div className="bg-blue-500/20 p-2 rounded font-mono text-center text-blue-400 text-lg">
                            {inviteCode}
                          </div>
                          <p className="text-gray-400 text-xs mt-2">
                            Note: Store this code securely. It will not be shown again.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {sendError && (
                    <div className="mb-6">
                      <ErrorState message={sendError} />
                    </div>
                  )}
                  
                  {/* Access explanation */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Access Permissions</h3>
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <p className="text-gray-300 mb-4">
                        This nominee has <AccessLevelBadge level={nominee.access_level} /> to your data, which means:
                      </p>
                      
                      <div className="space-y-3">
                        {nominee.access_level === 'Full' && (
                          <>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can view all investment details and documents</p>
                            </div>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can see your portfolio summary and overall value</p>
                            </div>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can access all documents you've uploaded</p>
                            </div>
                          </>
                        )}
                        
                        {nominee.access_level === 'Limited' && (
                          <>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can view basic investment information (excluding sensitive data)</p>
                            </div>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can see a summary of your portfolio</p>
                            </div>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can access documents marked as accessible to nominees</p>
                            </div>
                          </>
                        )}
                        
                        {nominee.access_level === 'DocumentsOnly' && (
                          <>
                            <div className="flex items-start">
                              <Check size={16} className="text-green-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Can only access documents marked as accessible to nominees</p>
                            </div>
                            <div className="flex items-start">
                              <AlertTriangle size={16} className="text-yellow-400 mt-0.5 mr-2" />
                              <p className="text-gray-300">Cannot view any investment details or summary</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Emergency access instructions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Emergency Access Instructions</h3>
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <p className="text-gray-300 mb-4">
                        In case of emergency, your nominee should:
                      </p>
                      
                      <ol className="space-y-3 pl-6 list-decimal text-gray-300">
                        <li>Go to the Sampatti website login page</li>
                        <li>Click on "Emergency Access" below the login form</li>
                        <li>Enter their email address: <span className="text-white">{nominee.email}</span></li>
                        <li>Enter the emergency access code you provided them</li>
                        <li>Follow the prompts to access your information</li>
                      </ol>
                      
                      <p className="mt-4 text-sm text-gray-400">
                        Note: All nominee access is logged and you will be notified whenever a nominee accesses your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Assets tab */}
              {activeTab === 'assets' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Assets {nominee.name} Can Access
                  </h3>
                  
                  {nominee.access_level === 'DocumentsOnly' ? (
                    <div className="p-6 text-center bg-gray-700/30 rounded-lg">
                      <FileText size={32} className="mx-auto mb-2 text-gray-500" />
                      <p className="text-white font-medium mb-1">Documents Only Access</p>
                      <p className="text-gray-400">
                        This nominee can only access documents and not any investment details.
                      </p>
                    </div>
                  ) : accessibleAssets.length === 0 ? (
                    <div className="p-6 text-center bg-gray-700/30 rounded-lg">
                      <PieChart size={32} className="mx-auto mb-2 text-gray-500" />
                      <p className="text-gray-400">
                        No investment assets are available to this nominee yet.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-700">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Asset Name
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Institution
                            </th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Current Value
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {accessibleAssets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-gray-700">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                                {asset.asset_name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400">
                                  {asset.asset_type}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                {asset.institution || '-'}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                                {formatCurrency(asset.current_value)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                <a 
                                  href={`/investments/${asset.id}`}
                                  className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink size={16} className="mr-1" />
                                  View
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Access Log Component
const AccessLogItem = ({ log, nomineeName }) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="p-4 border-b border-gray-700 last:border-0">
      <div className="flex items-start">
        <div className="p-2 rounded-full bg-blue-500/20 mr-3">
          <Clock size={16} className="text-blue-400" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-white font-medium">{log.action}</span>
              <span className="text-gray-400 ml-2">by</span>
              <span className="text-blue-400 ml-2">{nomineeName}</span>
            </div>
            <span className="text-xs text-gray-500">{formatDate(log.date)}</span>
          </div>
          
          {(log.ip_address || log.device_info) && (
            <div className="text-xs text-gray-400 mt-1">
              {log.ip_address && <span>IP: {log.ip_address}</span>}
              {log.ip_address && log.device_info && <span className="mx-1">•</span>}
              {log.device_info && <span>Device: {log.device_info}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Nominees component
const Nominees = () => {
  const [nominees, setNominees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingNominee, setEditingNominee] = useState(null);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Load nominees, assets, and access logs on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load nominees
        const nomineesData = await getNominees();
        if (!nomineesData || nomineesData.length === 0) {
          setNominees([]);
        } else {
          setNominees(nomineesData);
        }
        
        // Load access logs
        try {
          const logsData = await getNomineeAccessLogs();
          setAccessLogs(logsData || []);
        } catch (logError) {
          console.error('Failed to load access logs:', logError);
          setAccessLogs([]);
        }
        
        // Load assets for showing accessible assets to nominees
        try {
          setIsLoadingAssets(true);
          const assetsData = await getAssets();
          setAssets(assetsData || []);
        } catch (assetsError) {
          console.error('Failed to load assets:', assetsError);
          setAssets([]);
        } finally {
          setIsLoadingAssets(false);
        }
      } catch (err) {
        console.error('Error loading nominees:', err);
        setError('Failed to load nominees. Please try again.');
        setNominees([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter nominees based on search term
  const filteredNominees = nominees.filter(nominee => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      nominee.name.toLowerCase().includes(searchLower) ||
      nominee.email.toLowerCase().includes(searchLower) ||
      nominee.phone_number?.toLowerCase().includes(searchLower) ||
      nominee.relationship?.toLowerCase().includes(searchLower)
    );
  });
  
  // Create a new nominee
  const handleCreateNominee = async (formData) => {
    try {
      const newNominee = await createNominee(formData);
      setNominees(prev => [...prev, newNominee]);
      return newNominee;
    } catch (error) {
      console.error('Error creating nominee:', error);
      throw error;
    }
  };
  
  // Update an existing nominee
  const handleUpdateNominee = async (formData, nomineeId) => {
    try {
      const updatedNominee = await updateNominee(nomineeId, formData);
      setNominees(prev => 
        prev.map(nominee => nominee.id === nomineeId ? updatedNominee : nominee)
      );
      
      // Update selected nominee if it's currently being viewed
      if (selectedNominee && selectedNominee.id === nomineeId) {
        setSelectedNominee(updatedNominee);
      }
      
      return updatedNominee;
    } catch (error) {
      console.error('Error updating nominee:', error);
      throw error;
    }
  };
  
  // Delete a nominee
  const handleDeleteNominee = async (nomineeId) => {
    try {
      await deleteNominee(nomineeId);
      setNominees(prev => prev.filter(nominee => nominee.id !== nomineeId));
    } catch (error) {
      console.error('Error deleting nominee:', error);
      setError('Failed to delete nominee. Please try again.');
    }
  };
  
  // Send invitation to a nominee
  const handleSendInvitation = async (nomineeId) => {
    try {
      const inviteCode = await sendNomineeInvitation(nomineeId);
      
      // Update nominee status
      setNominees(prev => 
        prev.map(nominee => 
          nominee.id === nomineeId 
            ? { ...nominee, status: 'Pending' }
            : nominee
        )
      );
      
      // Update selected nominee if it's currently being viewed
      if (selectedNominee && selectedNominee.id === nomineeId) {
        setSelectedNominee(prev => ({ ...prev, status: 'Pending' }));
      }
      
      return inviteCode;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  };
  
  // View nominee details
  const handleViewNominee = (nominee) => {
    setSelectedNominee(nominee);
    setDetailModalOpen(true);
  };
  
  // Edit a nominee
  const handleEditNominee = (nominee) => {
    setEditingNominee(nominee);
    setShowForm(true);
  };
  
  // Submit form (create or update)
  const handleFormSubmit = async (formData, nomineeId = null) => {
    if (nomineeId) {
      return handleUpdateNominee(formData, nomineeId);
    } else {
      return handleCreateNominee(formData);
    }
  };
  
  // Get nominee name by ID (for access logs)
  const getNomineeName = (nomineeId) => {
    const nominee = nominees.find(n => n.id === nomineeId);
    return nominee ? nominee.name : 'Unknown Nominee';
  };
  
  if (isLoading) {
    return <LoadingState message="Loading nominees..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Nominees</h1>
          <p className="text-gray-400">Manage trusted individuals who can access your investment details</p>
        </div>
        
        <Button
          icon={<UserPlus size={18} />}
          onClick={() => {
            setEditingNominee(null);
            setShowForm(true);
          }}
          className="mt-4 md:mt-0"
        >
          Add Nominee
        </Button>
      </div>
      
      {/* Error message if any */}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nominees List */}
        <div className="md:col-span-2">
          {nominees.length === 0 ? (
            <EmptyState onAddNominee={() => {
              setEditingNominee(null);
              setShowForm(true);
            }} />
          ) : (
            <Card title="Your Nominees">
              <div className="mb-4">
                <Input
                  placeholder="Search nominees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search size={18} className="text-gray-500" />}
                />
              </div>
              
              {filteredNominees.length === 0 ? (
                <div className="p-6 text-center bg-gray-700/30 rounded-lg">
                  <p className="text-gray-400">No nominees match your search.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredNominees.map(nominee => (
                    <div 
                      key={nominee.id} 
                      className="p-4 hover:bg-gray-750 cursor-pointer"
                      onClick={() => handleViewNominee(nominee)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white">{nominee.name}</h3>
                        <StatusBadge status={nominee.status} />
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {nominee.relationship || 'No relationship specified'}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-blue-400">
                          <Mail size={14} className="mr-1" />
                          {nominee.email}
                        </div>
                        <AccessLevelBadge level={nominee.access_level} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
        
        {/* Recent Activity */}
        <div className="md:col-span-1">
          <Card title="Recent Activity">
            {accessLogs.length === 0 ? (
              <div className="p-6 text-center bg-gray-700/30 rounded-lg">
                <Clock size={24} className="mx-auto mb-2 text-gray-500" />
                <p className="text-gray-400">No recent nominee activity</p>
                <p className="text-sm text-gray-500 mt-1">Activity will appear here when nominees access your data</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
                {accessLogs.slice(0, 10).map((log, index) => (
                  <AccessLogItem 
                    key={log.id || index} 
                    log={log} 
                    nomineeName={getNomineeName(log.nominee_id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      
      {/* Form Modal */}
      <NomineeFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingNominee(null);
        }}
        onSubmit={handleFormSubmit}
        editingNominee={editingNominee}
      />
      
      {/* Detail Modal */}
      <NomineeDetailModal
        nominee={selectedNominee}
        assets={assets}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedNominee(null);
        }}
        onEdit={handleEditNominee}
        onDelete={handleDeleteNominee}
        onSendInvite={handleSendInvitation}
      />
    </div>
  );
};

export default Nominees;
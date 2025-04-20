// src/pages/Settings.jsx - Version without API calls
import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Lock, Bell, 
  Database, Shield, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Import common components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const Settings = () => {
  const { currentUser, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: '',
    phone_number: '',
    date_of_birth: '',
  });
  
  const [settingsData, setSettingsData] = useState({
    notifications: true,
    default_currency: 'INR',
    two_factor_enabled: false
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Error states
  const [profileError, setProfileError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Success states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Initialize data from currentUser (replacing API call)
  useEffect(() => {
    // Simulate loading for a short time
    setIsLoading(true);
    
    // Short timeout to simulate data fetching
    const timer = setTimeout(() => {
      if (currentUser) {
        // Initialize profile data from current user
        setProfileData({
          name: currentUser.name || '',
          phone_number: currentUser.phone_number || '',
          date_of_birth: currentUser.date_of_birth 
            ? new Date(currentUser.date_of_birth).toISOString().split('T')[0] 
            : '',
        });
        
        // Initialize settings data
        setSettingsData({
          notifications: currentUser.notifications !== false,
          default_currency: currentUser.default_currency || 'INR',
          two_factor_enabled: currentUser.two_factor_enabled || false
        });
      }
      
      setIsLoading(false);
    }, 500); // Just enough delay to show loading state
    
    return () => clearTimeout(timer);
  }, [currentUser]);
  
  // Handle form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submissions
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // Update auth context with new profile data
        updateUser(profileData);
        setProfileSuccess('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        setProfileError('Failed to update profile. Please try again.');
      } finally {
        setIsUpdatingProfile(false);
      }
    }, 800); // Simulate network delay
  };
  
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setIsUpdatingSettings(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      try {
        // Update auth context with new settings
        updateUser(settingsData);
        setSettingsSuccess('Settings updated successfully');
      } catch (err) {
        console.error('Error updating settings:', err);
        setSettingsError('Failed to update settings. Please try again.');
      } finally {
        setIsUpdatingSettings(false);
      }
    }, 800); // Simulate network delay
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    setIsChangingPassword(true);
    
    // Simulate password change with setTimeout
    setTimeout(() => {
      try {
        // Simple validation - in real app, would verify old password first
        if (passwordData.old_password === 'wrong-password') {
          throw new Error('Current password is incorrect');
        }
        
        setPasswordSuccess('Password changed successfully');
        
        // Reset password fields
        setPasswordData({
          old_password: '',
          new_password: '',
          confirm_password: ''
        });
      } catch (err) {
        console.error('Error changing password:', err);
        setPasswordError(err.message || 'Failed to change password. Please check your current password and try again.');
      } finally {
        setIsChangingPassword(false);
      }
    }, 1000); // Simulate network delay
  };
  
  // Reset success messages after 5 seconds
  useEffect(() => {
    const clearSuccessMessages = () => {
      if (profileSuccess) setTimeout(() => setProfileSuccess(''), 5000);
      if (settingsSuccess) setTimeout(() => setSettingsSuccess(''), 5000);
      if (passwordSuccess) setTimeout(() => setPasswordSuccess(''), 5000);
    };
    
    clearSuccessMessages();
  }, [profileSuccess, settingsSuccess, passwordSuccess]);
  
  if (isLoading) {
    return <LoadingState message="Loading settings..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1 text-white">Settings</h1>
        <p className="text-gray-400">Manage your account settings and preferences</p>
      </div>
      
      {/* Error message if any */}
      {error && <ErrorState message={error} onRetry={() => window.location.reload()} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card title={
          <div className="flex items-center">
            <User className="mr-2 text-blue-400" size={18} />
            <span>Profile Information</span>
          </div>
        }>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileError && <ErrorState message={profileError} />}
            {profileSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center">
                <Check size={16} className="mr-2" />
                {profileSuccess}
              </div>
            )}
            
            <Input
              label="Full Name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              placeholder="Your full name"
              required
            />
            
            <Input
              label="Phone Number"
              name="phone_number"
              value={profileData.phone_number}
              onChange={handleProfileChange}
              placeholder="Your phone number"
            />
            
            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={profileData.date_of_birth}
              onChange={handleProfileChange}
            />
            
            <div className="pt-4">
              <Button
                type="submit"
                isLoading={isUpdatingProfile}
              >
                Update Profile
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Account Settings */}
        <Card title={
          <div className="flex items-center">
            <Database className="mr-2 text-purple-400" size={18} />
            <span>Account Preferences</span>
          </div>
        }>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            {settingsError && <ErrorState message={settingsError} />}
            {settingsSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center">
                <Check size={16} className="mr-2" />
                {settingsSuccess}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Currency Preference
              </label>
              <select
                name="default_currency"
                value={settingsData.default_currency}
                onChange={handleSettingsChange}
                className="block w-full px-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between pt-3">
              <div>
                <label htmlFor="notifications" className="block text-white font-medium">
                  Enable Notifications
                </label>
                <p className="text-gray-400 text-sm">
                  Receive alerts about investments
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="notifications"
                  id="notifications"
                  checked={settingsData.notifications} 
                  onChange={handleSettingsChange}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between pt-3">
              <div>
                <label htmlFor="two_factor_enabled" className="block text-white font-medium">
                  Two-Factor Authentication
                </label>
                <p className="text-gray-400 text-sm">
                  Add an extra layer of security
                </p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="two_factor_enabled"
                  id="two_factor_enabled"
                  checked={settingsData.two_factor_enabled} 
                  onChange={handleSettingsChange}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                isLoading={isUpdatingSettings}
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Security Settings */}
        <Card title={
          <div className="flex items-center">
            <Shield className="mr-2 text-green-400" size={18} />
            <span>Security</span>
          </div>
        }>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && <ErrorState message={passwordError} />}
            {passwordSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center">
                <Check size={16} className="mr-2" />
                {passwordSuccess}
              </div>
            )}
            
            <Input
              label="Current Password"
              name="old_password"
              type="password"
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              placeholder="Enter your current password"
              required
            />
            
            <Input
              label="New Password"
              name="new_password"
              type="password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
              hint="Must be at least 8 characters long"
            />
            
            <Input
              label="Confirm New Password"
              name="confirm_password"
              type="password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
              required
            />
            
            <div className="pt-4">
              <Button
                type="submit"
                isLoading={isChangingPassword}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Notification Settings */}
        <Card title={
          <div className="flex items-center">
            <Bell className="mr-2 text-yellow-400" size={18} />
            <span>Notification Preferences</span>
          </div>
        }>
          <div className="space-y-5">
            <p className="text-gray-400">
              Choose which notifications you'd like to receive about your investments.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Investment Maturity</span>
                  <p className="text-sm text-gray-400">
                    Get notified when your investments are about to mature
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Price Alerts</span>
                  <p className="text-sm text-gray-400">
                    Get notified about significant price changes
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Nominee Activity</span>
                  <p className="text-sm text-gray-400">
                    Get notified when a nominee accesses your data
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Security Alerts</span>
                  <p className="text-sm text-gray-400">
                    Get notified about account security events
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            <div className="pt-4">
              <Button>
                Save Notification Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Danger Zone */}
      <Card className="mt-8 border-red-500/30">
        <h3 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <p className="text-gray-400">
            These actions are permanent and cannot be undone. Be careful!
          </p>
          
          <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Export Account Data</h4>
              <p className="text-sm text-gray-400">
                Download all your account data as a JSON file
              </p>
            </div>
            <Button variant="secondary">
              Export Data
            </Button>
          </div>
          
          <div className="flex justify-between items-center p-4 border border-gray-700 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Delete Account</h4>
              <p className="text-sm text-gray-400">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="danger">
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
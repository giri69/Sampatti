import { useState, useEffect } from 'react';
import { Mail, User, Shield } from 'lucide-react';

const NomineeForm = ({ isOpen, onClose, onSubmit, editingNominee = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
        access_level: editingNominee.access_level || 'Limited'
      });
    } else {
      // Reset form for new nominee
      setFormData({
        name: '',
        email: '',
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
    
    if (!formData.email.includes('@')) {
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
              Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                placeholder="Enter nominee's email"
                required
                disabled={isLoading || (editingNominee !== null)}
              />
            </div>
            {editingNominee && (
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            )}
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-white">
              Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                placeholder="Enter nominee's name"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Access Level <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield size={18} className="text-gray-500" />
              </div>
              <select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                className="block w-full pl-10 px-3 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-white"
                disabled={isLoading}
                required
              >
                <option value="DocumentsOnly">Documents Only</option>
                <option value="Limited">Limited Access</option>
                <option value="Full">Full Access</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formData.access_level === 'Full' 
                ? 'Full Access: All investments and documents'
                : formData.access_level === 'Limited'
                ? 'Limited Access: Basic investment info and documents'
                : 'Documents Only: Only documents you share'}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editingNominee ? 'Update' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NomineeForm;
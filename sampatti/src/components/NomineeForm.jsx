import { useState, useEffect } from 'react';
import { Mail, User, Phone, Shield } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ErrorState from '../components/common/ErrorState';

const NomineeForm = ({ isOpen, onClose, onSubmit, editingNominee = null }) => {
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
            <ErrorState message={error} />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            hint={editingNominee ? "Email cannot be changed" : "Nominee will use this email for access"}
          />
          
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter nominee's full name"
            icon={<User size={18} className="text-gray-500" />}
            required
            disabled={isLoading}
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
              disabled={isLoading}
            >
              {editingNominee ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NomineeForm;
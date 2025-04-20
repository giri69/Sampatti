// src/pages/auth/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Phone } from 'lucide-react';
import { registerUser } from '../../utils/api';

// Import common components
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ErrorState from '../../components/common/ErrorState';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    
    // Password length validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API - remove confirmPassword as it's not needed on backend
      const { confirmPassword, ...apiData } = formData;
      
      // Call the registration API
      await registerUser(apiData);
      
      // Redirect to login with success message
      navigate('/login', { 
        state: { message: 'Account created successfully! Please sign in.' } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message && err.message.includes('already exists')) {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Logo for mobile view */}
      <div className="mb-8 flex items-center md:hidden">
        <Lock className="text-white mr-2" size={24} />
        <span className="font-bold text-2xl tracking-tight text-white">Sampatti</span>
      </div>

      <h2 className="text-3xl font-bold mb-2 text-white">Create your account</h2>
      <p className="text-gray-400 mb-8">Start tracking your investments securely.</p>
      
      {error && <ErrorState message={error} />}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          icon={<User size={18} className="text-gray-500" />}
          required
        />
        
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          icon={<Mail size={18} className="text-gray-500" />}
          required
        />
        
        <Input
          label="Phone Number (Optional)"
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Enter your phone number"
          icon={<Phone size={18} className="text-gray-500" />}
        />
        
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          icon={<Lock size={18} className="text-gray-500" />}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          hint="Must be at least 8 characters long"
          required
          minLength="8"
        />
        
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          icon={<Lock size={18} className="text-gray-500" />}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          required
        />
        
        <div className="flex items-start pt-2">
          <input
            id="terms"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-600 bg-black text-blue-500 focus:ring-blue-500 mt-1"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
            I agree to the{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
          </label>
        </div>
        
        <Button
          type="submit"
          variant="white"
          isLoading={isLoading}
          className="w-full mt-4"
        >
          Create account
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-white">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
          Sign in instead
        </Link>
      </p>
    </div>
  );
};

export default Register;
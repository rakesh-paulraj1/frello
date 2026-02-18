import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from './Button';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import type { AuthError } from '../types/errors';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export default function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.signup(formData);
      setAuth(response.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="border-4 border-dashed border-black bg-white p-8 space-y-5">
      <h3 className="text-3xl font-bold text-black mb-6">Sign Up</h3>
      
      {error && (
        <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm">
          {(error as AuthError)?.response?.data?.error || 'Signup failed. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            className="w-full px-5 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
            required
          />
        </div>
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full px-5 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
            required
          />
        </div>
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-5 py-3 text-base border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
            style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
            required
          />
        </div>
        <Button 
          variant="primary" 
          size="lg"
          className="w-full mt-6"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <p className="text-base text-gray-600 text-center mt-6">
        Already have an account?{' '}
        <button
          onClick={onSwitchToSignIn}
          className="font-medium text-black underline hover:no-underline"
          type="button"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}

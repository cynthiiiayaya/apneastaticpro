import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const LoginForm: React.FC = () => {
  const { login, loading } = useUser();
  const navigate = useNavigate(); // Add navigate hook for redirection
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ text: 'Please enter your email', type: 'error' });
      return;
    }
    
    try {
      setMessage({ text: 'Logging in...', type: 'info' });
      const { error } = await login(email);
      
      if (error) {
        setMessage({ text: error, type: 'error' });
      } else {
        setMessage({ 
          text: 'Login successful!', 
          type: 'success' 
        });
        setEmail('');
        
        // Redirect to the homepage after successful login
        setTimeout(() => {
          navigate('/');
        }, 1000); // Small delay to show success message
      }
    } catch (error) {
      setMessage({ 
        text: 'An error occurred during login. Please try again.',
        type: 'error'
      });
    }
  };
  
  return (
    <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30">
      <h2 className="text-xl font-semibold text-ocean-100 mb-4">Login to Sync Your Tables</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="email" 
            className="block text-ocean-200 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-ocean-900/50 border border-ocean-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            disabled={loading}
          />
        </div>
        
        {message && (
          <div className={`p-3 rounded text-sm ${
            message.type === 'success' ? 'bg-seagreen-900/50 border border-seagreen-800 text-seagreen-200' :
            message.type === 'error' ? 'bg-red-900/50 border border-red-800 text-red-200' :
            'bg-ocean-900/50 border border-ocean-800 text-ocean-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <Loader size={20} className="animate-spin mr-2" />
          ) : (
            <LogIn size={20} className="mr-2" />
          )}
          Continue with Email
        </button>
      </form>
      
      <div className="mt-4 text-ocean-400 text-sm">
        <p>Simply enter your email to login or sign up - no verification needed!</p>
      </div>
    </div>
  );
};

export default LoginForm;
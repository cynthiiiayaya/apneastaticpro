import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-ocean-300 hover:text-ocean-100 mr-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-ocean-100">Login or Sign Up</h1>
      </div>
      
      <LoginForm />
      
      <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30 text-center">
        <p className="text-ocean-200 mb-4">
          ApneaStatic helps you track and improve your breath-hold capacity with customized training tables.
        </p>
        <p className="text-ocean-300">
          Simply enter your email to get started - no password or verification needed!
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
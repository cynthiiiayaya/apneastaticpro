import React from 'react';
import { Save, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../contexts/TimerContext';

interface StopConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const StopConfirmationDialog: React.FC<StopConfirmationDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { savePracticeRecord, stopTimer, resumeTimer } = useTimer();
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    // Save the practice record
    await savePracticeRecord();
    
    // Mark as complete and show results
    stopTimer(true);
    onClose();
  };
  
  const handleDontSave = () => {
    // Stop the timer completely and return home
    stopTimer(false);
    onClose();
    navigate('/');
  };
  
  const handleBack = () => {
    // Resume the timer
    resumeTimer();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="bg-ocean-900 border border-ocean-700 rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-ocean-800 border-b border-ocean-700">
          <h2 className="text-xl font-semibold text-ocean-100">Stop Training Session?</h2>
        </div>
        
        <div className="p-6">
          <p className="text-ocean-200 mb-4">
            Do you want to save your progress so far, or discard this training session?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full bg-seagreen-600 hover:bg-seagreen-500 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <Save size={18} className="mr-2" />
              Save and Complete
            </button>
            
            <button
              onClick={handleDontSave}
              className="w-full bg-red-700 hover:bg-red-600 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <Home size={18} className="mr-2" />
              Don't Save
            </button>
            
            <button
              onClick={handleBack}
              className="w-full bg-ocean-700 hover:bg-ocean-600 text-white py-3 px-4 rounded-lg flex items-center justify-center"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Training
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopConfirmationDialog;
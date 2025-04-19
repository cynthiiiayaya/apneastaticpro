import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { useTable } from '../contexts/TableContext';
import { useTimer } from '../contexts/TimerContext';
import Timer from '../components/Timer';
import EditTableModal from '../components/EditTableModal';
import BreathHoldChart from '../components/BreathHoldChart';
import { formatTimeToWords } from '../utils/helpers';
import { TrainingTable } from '../types';

const TableDetailPage: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const { tables, deleteTable, setActiveTable } = useTable();
  const { startTimer, phase, cycleResults, stopTimer } = useTimer();
  const navigate = useNavigate();
  
  const [table, setTable] = useState<TrainingTable | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Check if timer is active - we'll hide action buttons during active session
  const isTimerActive = phase !== 'idle' && phase !== 'complete';
  const isSessionComplete = phase === 'complete';
  
  // Clear timer state and cycle results when component unmounts or tableId changes
  useEffect(() => {
    return () => {
      // Only clear if not in an idle state (don't affect active timers)
      if (phase !== 'idle' && phase !== 'breathe' && phase !== 'hold') {
        stopTimer(false); // Reset without saving
      }
    };
  }, [tableId, stopTimer, phase]);
  
  useEffect(() => {
    if (tableId) {
      const foundTable = tables.find(t => t.id === tableId);
      if (foundTable) {
        setTable(foundTable);
        if (phase === 'breathe' || phase === 'hold') {
          setActiveTable(foundTable);
        }
      } else {
        // Table not found, redirect to home
        navigate('/');
      }
    }
  }, [tableId, tables, navigate, phase, setActiveTable]);
  
  if (!table) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  const handleStartTraining = () => {
    startTimer(table.cycles);
    setActiveTable(table);
  };
  
  const handleDeleteTable = () => {
    if (confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      deleteTable(table.id);
      navigate('/');
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-ocean-300 hover:text-ocean-100 mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to tables
          </button>
          <h1 className="text-3xl font-bold text-ocean-100">{table.name}</h1>
        </div>
        
        {!isTimerActive && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(true)}
              className="bg-ocean-700 hover:bg-ocean-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <Edit size={18} className="mr-1" />
              Edit
            </button>
            
            <button
              onClick={handleDeleteTable}
              className="bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <Trash2 size={18} className="mr-1" />
              Delete
            </button>
            
            <button
              onClick={handleStartTraining}
              className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <Play size={18} className="mr-1" />
              Start
            </button>
          </div>
        )}
      </div>
      
      {/* Timer (shown when active) */}
      {phase !== 'idle' && (
        <div className="mb-8">
          <Timer />
        </div>
      )}
      
      {/* Results chart (shown when session is complete) */}
      {isSessionComplete && cycleResults.length > 0 && (
        <div className="space-y-4">
          <BreathHoldChart results={cycleResults} />
          
          <div className="p-4 bg-seagreen-900/30 border border-seagreen-800/50 rounded-lg text-center">
            <p className="text-seagreen-200">
              Your practice session has been automatically saved to your history.
            </p>
          </div>
        </div>
      )}
      
      {/* Table details */}
      <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30">
        <h2 className="text-xl font-semibold text-ocean-100 mb-4">Training Cycles</h2>
        
        <div className="space-y-3">
          {table.cycles.map((cycle, index) => (
            <div key={index} className="bg-ocean-900/30 p-4 rounded-lg border border-ocean-800/50">
              <h3 className="font-medium text-ocean-200 mb-3">Cycle {index + 1}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ocean-950/50 p-3 rounded flex flex-col">
                  <span className="text-xs uppercase text-ocean-400 mb-1">Breathe</span>
                  <div className="flex items-baseline">
                    <span className="text-seagreen-400 text-lg font-medium">{formatTimeToWords(cycle.breatheTime)}</span>
                  </div>
                </div>
                
                <div className="bg-ocean-950/50 p-3 rounded flex flex-col">
                  <span className="text-xs uppercase text-ocean-400 mb-1">Hold</span>
                  <div className="flex items-baseline">
                    <span className="text-ocean-200 text-lg font-medium">
                      {cycle.tapMode ? 
                        `${formatTimeToWords(cycle.holdTime)} (Tap Mode)` : 
                        formatTimeToWords(cycle.holdTime)
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <EditTableModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        table={table} 
      />
    </div>
  );
};

export default TableDetailPage;
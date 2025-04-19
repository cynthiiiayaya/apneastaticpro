import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus } from 'lucide-react';
import { useTable } from '../contexts/TableContext';
import { useTimer } from '../contexts/TimerContext';
import { useUser } from '../contexts/UserContext';
import { formatTimeToWords } from '../utils/helpers';
import TableForm from '../components/TableForm';
import LoginForm from '../components/LoginForm';

const HomePage: React.FC = () => {
  const { tables, setActiveTable, loading } = useTable();
  const { user } = useUser();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const handleSelectTable = (tableId: string) => {
    navigate(`/${tableId}`);
  };
  
  // Calculate total duration of a table
  const calculateTotalDuration = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return 0;
    
    return table.cycles.reduce((total, cycle) => total + cycle.breatheTime + cycle.holdTime, 0);
  };
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ocean-100">Training Tables</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg flex items-center"
        >
          {showCreateForm ? 'Cancel' : (
            <>
              <Plus size={18} className="mr-1" />
              Create Table
            </>
          )}
        </button>
      </div>
      
      {/* Create form or login form */}
      {showCreateForm ? (
        <div className="mb-8">
          <TableForm onTableCreated={() => setShowCreateForm(false)} />
        </div>
      ) : (
        !user && (
          <div className="mb-8">
            <LoginForm />
          </div>
        )
      )}
      
      {/* Table list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-ocean-300">Loading tables...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div 
              key={table.id} 
              className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30 cursor-pointer hover:border-ocean-600 transition-colors"
              onClick={() => handleSelectTable(table.id)}
            >
              <h3 className="font-semibold text-lg text-ocean-100 mb-2">{table.name}</h3>
              
              <div className="text-ocean-300 text-sm">
                <p className="mb-2">{table.cycles.length} cycles • {formatTimeToWords(calculateTotalDuration(table.id))} total</p>
                
                <div className="bg-ocean-900/50 p-2 rounded border border-ocean-800/50">
                  <span className="text-xs uppercase text-ocean-400">Sample Cycle</span>
                  <p className="text-ocean-200 mt-1">
                    <span className="text-seagreen-400">{formatTimeToWords(table.cycles[0].breatheTime)} breathe</span>
                    <span className="text-ocean-300"> / </span>
                    <span className="text-ocean-400">{formatTimeToWords(table.cycles[0].holdTime)} hold</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button 
                  className="flex items-center text-ocean-200 text-sm hover:text-ocean-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${table.id}`);
                  }}
                >
                  <Play size={14} className="mr-1" />
                  Start Training
                </button>
              </div>
            </div>
          ))}
          
          {tables.length === 0 && !showCreateForm && (
            <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30 text-center col-span-full">
              <p className="text-ocean-300 mb-4">
                {user 
                  ? "No saved tables yet. Create your first training table!" 
                  : "Log in to save your tables across devices."}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg flex items-center mx-auto"
              >
                <Plus size={18} className="mr-1" />
                Create Table
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
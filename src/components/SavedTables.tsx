import React, { useState } from 'react';
import { Play, Edit, Trash2, Clock } from 'lucide-react';
import { useTable } from '../contexts/TableContext';
import { useTimer } from '../contexts/TimerContext';
import { formatTimeToWords } from '../utils/helpers';
import EditTableModal from './EditTableModal';
import { TrainingTable } from '../types';

const SavedTables: React.FC = () => {
  const { tables, deleteTable, setActiveTable } = useTable();
  const { startTimer } = useTimer();
  const [editingTable, setEditingTable] = useState<TrainingTable | null>(null);
  
  const handleStart = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      startTimer(table.cycles);
      setActiveTable(table);
    }
  };
  
  const handleEdit = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setEditingTable(table);
    }
  };
  
  // Calculate total duration of a table
  const calculateTotalDuration = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return 0;
    
    return table.cycles.reduce((total, cycle) => total + cycle.breatheTime + cycle.holdTime, 0);
  };
  
  if (tables.length === 0) {
    return (
      <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30 text-center">
        <p className="text-ocean-300">No saved tables yet. Create your first table above!</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-6 border border-ocean-700/30">
        <h2 className="text-2xl font-bold mb-4 text-ocean-100">Saved Tables</h2>
        
        <div className="space-y-4">
          {tables.map(table => (
            <div 
              key={table.id} 
              className="bg-ocean-900/30 p-4 rounded-lg border border-ocean-800/50 hover:border-ocean-600/50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-ocean-100">{table.name}</h3>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStart(table.id)}
                    className="p-2 bg-seagreen-700 hover:bg-seagreen-600 rounded-full text-white"
                    title="Start Training"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(table.id)}
                    className="p-2 bg-ocean-700 hover:bg-ocean-600 rounded-full text-white"
                    title="Edit Table"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="p-2 bg-red-700 hover:bg-red-600 rounded-full text-white"
                    title="Delete Table"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-ocean-300 text-sm flex items-center">
                <Clock size={14} className="mr-1" />
                <span>Total Duration: {formatTimeToWords(calculateTotalDuration(table.id))}</span>
              </div>
              
              <div className="mt-3 space-y-2">
                {table.cycles.map((cycle, index) => (
                  <div key={index} className="bg-ocean-950/50 p-3 rounded border border-ocean-800/50">
                    <div className="flex justify-between mb-1">
                      <span className="text-ocean-400 font-medium">Cycle {index + 1}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4">
                      <div className="flex items-center">
                        <span className="text-seagreen-400 font-medium">{formatTimeToWords(cycle.breatheTime)}</span>
                        <span className="text-ocean-400 mx-2">breathe</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-ocean-300 font-medium">{formatTimeToWords(cycle.holdTime)}</span>
                        <span className="text-ocean-400 mx-2">hold</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <EditTableModal 
        isOpen={!!editingTable} 
        onClose={() => setEditingTable(null)} 
        table={editingTable} 
      />
    </>
  );
};

export default SavedTables;
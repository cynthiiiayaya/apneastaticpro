import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Save, X, Hand as HandStop } from 'lucide-react';
import { useTable } from '../contexts/TableContext';
import { BreathCycle, TrainingTable } from '../types';
import { formatTimeToWords, validateCycle } from '../utils/helpers';
import TimeInput from './TimeInput';

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TrainingTable | null;
}

const EditTableModal: React.FC<EditTableModalProps> = ({ isOpen, onClose, table }) => {
  const { updateTable } = useTable();
  
  const [tableName, setTableName] = useState('');
  const [cycles, setCycles] = useState<BreathCycle[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form when table changes
  useEffect(() => {
    if (table) {
      setTableName(table.name);
      // Ensure all cycles have tapMode property
      const updatedCycles = table.cycles.map(cycle => ({
        ...cycle,
        tapMode: cycle.tapMode || false
      }));
      setCycles([...updatedCycles]);
      setError(null);
    }
  }, [table]);
  
  const addCycle = () => {
    setCycles([...cycles, { breatheTime: 60, holdTime: 60, tapMode: false }]);
  };
  
  const removeCycle = (index: number) => {
    if (cycles.length === 1) {
      setError('You must have at least one cycle');
      return;
    }
    const newCycles = [...cycles];
    newCycles.splice(index, 1);
    setCycles(newCycles);
    setError(null);
  };
  
  const updateCycle = (index: number, field: keyof BreathCycle, value: number) => {
    const newCycles = [...cycles];
    newCycles[index] = {
      ...newCycles[index],
      [field]: value
    };
    setCycles(newCycles);
    
    // Validate the updated cycle
    if (field === 'breatheTime' || field === 'holdTime') {
      const error = validateCycle(newCycles[index].breatheTime, newCycles[index].holdTime);
      setError(error);
    }
  };

  const toggleTapMode = (index: number) => {
    const newCycles = [...cycles];
    newCycles[index] = {
      ...newCycles[index],
      tapMode: !newCycles[index].tapMode
    };
    setCycles(newCycles);
  };
  
  const handleSave = () => {
    if (!table) return;
    
    // Check if table has a name
    if (!tableName.trim()) {
      setError('Table name is required');
      return;
    }
    
    // Validate all cycles
    for (const cycle of cycles) {
      const error = validateCycle(cycle.breatheTime, cycle.holdTime);
      if (error) {
        setError(error);
        return;
      }
    }
    
    // Update the table
    updateTable(table.id, {
      name: tableName,
      cycles: [...cycles]
    });
    
    setError(null);
    onClose();
  };
  
  if (!isOpen || !table) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="bg-ocean-900 border border-ocean-700 rounded-lg shadow-xl max-w-3xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-ocean-800 flex items-center justify-between border-b border-ocean-700">
          <h2 className="text-xl font-semibold text-ocean-100">Edit Training Table</h2>
          <button
            onClick={onClose}
            className="text-ocean-300 hover:text-ocean-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Table name input */}
          <div className="mb-6">
            <label htmlFor="tableName" className="block text-ocean-200 mb-2">
              Table Name
            </label>
            <input
              type="text"
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-ocean-900/50 border border-ocean-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            />
          </div>
          
          {/* Cycles */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-ocean-100">Cycles</h3>
              <button
                onClick={addCycle}
                className="flex items-center text-seagreen-400 hover:text-seagreen-300"
              >
                <PlusCircle size={18} className="mr-1" />
                Add Cycle
              </button>
            </div>
            
            {cycles.map((cycle, index) => (
              <div 
                key={index} 
                className="bg-ocean-900/30 p-4 rounded-lg mb-3 border border-ocean-800/50"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-ocean-200">Cycle {index + 1}</h4>
                  <button
                    onClick={() => removeCycle(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <TimeInput 
                    label="Breathe Time"
                    value={cycle.breatheTime}
                    onChange={(value) => updateCycle(index, 'breatheTime', value)}
                    min={1}
                    max={300}
                  />
                  <div>
                    <TimeInput 
                      label="Hold Time"
                      value={cycle.holdTime}
                      onChange={(value) => updateCycle(index, 'holdTime', value)}
                      min={1}
                      max={300}
                      disabled={cycle.tapMode}
                    />
                    
                    <div className="mt-2 flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleTapMode(index)}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                          cycle.tapMode 
                            ? 'bg-seagreen-600 text-white' 
                            : 'bg-ocean-800 text-ocean-300'
                        }`}
                      >
                        <HandStop size={16} />
                        <span>{cycle.tapMode ? 'Tap Mode Enabled' : 'Enable Tap Mode'}</span>
                      </button>
                    </div>
                    
                    {cycle.tapMode && (
                      <div className="mt-1 text-xs text-seagreen-400">
                        Tap to end breath hold (for max attempts)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-lg mb-6">
              {error}
            </div>
          )}
        </div>
        
        <div className="border-t border-ocean-700 p-4 bg-ocean-800/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ocean-700 hover:bg-ocean-600 text-white rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-seagreen-600 hover:bg-seagreen-500 text-white rounded flex items-center"
          >
            <Save size={16} className="mr-1" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTableModal;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Table2, Clock, Trash2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { PracticeRecord, CycleResult } from '../types';
import BreathHoldChart from '../components/BreathHoldChart';

const HistoryPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    const fetchPracticeRecords = async () => {
      if (!user) {
        setRecords([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch practice records
        const { data: recordsData, error: recordsError } = await supabase
          .from('practice_records')
          .select(`
            id,
            table_id,
            completed_at,
            results,
            training_tables(name)
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        
        if (recordsError) {
          console.error('Error fetching practice records:', recordsError);
          return;
        }

        // Format the data
        const formattedRecords: PracticeRecord[] = recordsData.map(record => ({
          id: record.id,
          tableId: record.table_id,
          tableName: record.training_tables?.name || 'Unknown Table',
          completedAt: new Date(record.completed_at).getTime(),
          results: JSON.parse(record.results) as CycleResult[]
        }));

        setRecords(formattedRecords);
      } catch (error) {
        console.error('Error in fetchPracticeRecords:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeRecords();
  }, [user]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalDuration = (results: CycleResult[]): string => {
    const totalSeconds = results.reduce((total, cycle) => 
      total + cycle.breatheTime + cycle.actualHoldTime, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) return `${seconds} seconds`;
    if (seconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId);
  };

  const deleteRecord = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row from expanding when clicking delete
    
    if (!confirm('Are you sure you want to delete this training record? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('practice_records')
        .delete()
        .eq('id', recordId)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error deleting practice record:', error);
        alert('Failed to delete record. Please try again.');
        return;
      }
      
      // Update local state
      setRecords(prev => prev.filter(record => record.id !== recordId));
      
      // Close expanded view if this record was expanded
      if (expandedRecord === recordId) {
        setExpandedRecord(null);
      }
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      alert('An error occurred while deleting the record.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-ocean-300 hover:text-ocean-100 mr-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-ocean-100">Training History</h1>
        </div>
        
        <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-8 border border-ocean-700/30 text-center">
          <p className="text-ocean-200 mb-4">Please log in to view your training history.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-ocean-300 hover:text-ocean-100 mr-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-ocean-100">Training History</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-ocean-300">Loading your training history...</div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg p-8 border border-ocean-700/30 text-center">
          <p className="text-ocean-200 mb-4">You don't have any saved training sessions yet.</p>
          <p className="text-ocean-300 mb-6">Complete a training session and it will automatically be saved here.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg"
          >
            Start Training
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              className="bg-ocean-800/50 backdrop-blur rounded-lg shadow-lg border border-ocean-700/30 overflow-hidden"
            >
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <div 
                  className="flex-grow cursor-pointer hover:text-ocean-100"
                  onClick={() => toggleExpandRecord(record.id)}
                >
                  <h3 className="font-semibold text-lg text-ocean-100">{record.tableName}</h3>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-ocean-300">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(record.completedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>{formatTime(record.completedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Table2 size={14} className="mr-1" />
                      <span>{record.results.length} cycles • {calculateTotalDuration(record.results)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <button
                    onClick={(e) => deleteRecord(record.id, e)}
                    className="p-2 bg-red-700/50 hover:bg-red-600 rounded-full text-white ml-2"
                    title="Delete record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {expandedRecord === record.id && (
                <div className="px-4 py-6 border-t border-ocean-700/50">
                  <BreathHoldChart results={record.results} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
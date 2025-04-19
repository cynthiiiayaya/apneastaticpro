import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TrainingTable, BreathCycle } from '../types';
import { generateId } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import { useUser } from './UserContext';

interface TableContextType {
  tables: TrainingTable[];
  activeTable: TrainingTable | null;
  loading: boolean;
  setActiveTable: (table: TrainingTable | null) => void;
  createTable: (name: string, cycles: BreathCycle[]) => TrainingTable;
  updateTable: (id: string, data: Partial<TrainingTable>) => void;
  deleteTable: (id: string) => void;
  getTable: (id: string) => TrainingTable | undefined;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

// Default tables for new users with no database connection
const defaultTables: TrainingTable[] = [
  {
    id: 'default-co2-table',
    name: 'CO2 Training Table',
    cycles: [
      { breatheTime: 60, holdTime: 60 },
      { breatheTime: 45, holdTime: 75 },
      { breatheTime: 45, holdTime: 90 },
      { breatheTime: 30, holdTime: 105 },
      { breatheTime: 30, holdTime: 120 },
      { breatheTime: 30, holdTime: 135 },
    ],
    createdAt: Date.now(),
  },
  {
    id: 'default-o2-table',
    name: 'O2 Training Table',
    cycles: [
      { breatheTime: 120, holdTime: 60 },
      { breatheTime: 120, holdTime: 75 },
      { breatheTime: 120, holdTime: 90 },
      { breatheTime: 120, holdTime: 105 },
      { breatheTime: 120, holdTime: 120 },
      { breatheTime: 120, holdTime: 135 },
    ],
    createdAt: Date.now(),
  },
];

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [tables, setTables] = useState<TrainingTable[]>(() => {
    const savedTables = localStorage.getItem('trainingTables');
    return savedTables ? JSON.parse(savedTables) : defaultTables;
  });
  
  const [activeTable, setActiveTable] = useState<TrainingTable | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Load tables from Supabase when user changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!user) {
        // If no user, use localStorage tables
        const savedTables = localStorage.getItem('trainingTables');
        setTables(savedTables ? JSON.parse(savedTables) : defaultTables);
        return;
      }
      
      try {
        setLoading(true);
        
        // Store user info in localStorage for development RLS bypass
        localStorage.setItem('user', JSON.stringify(user));
        
        // Fetch tables for the current user
        const { data: tablesData, error: tablesError } = await supabase
          .from('training_tables')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (tablesError) {
          console.error('Error fetching tables:', tablesError);
          return;
        }
        
        // Fetch cycles for all tables
        const tableIds = tablesData.map(table => table.id);
        
        if (tableIds.length === 0) {
          setTables([]);
          return;
        }
        
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('breath_cycles')
          .select('table_id, breathe_time, hold_time, cycle_index, tap_mode')
          .in('table_id', tableIds)
          .order('cycle_index', { ascending: true });
        
        if (cyclesError) {
          console.error('Error fetching cycles:', cyclesError);
          return;
        }
        
        // Convert to our TrainingTable format
        const formattedTables: TrainingTable[] = tablesData.map(table => {
          const tableCycles = cyclesData
            .filter(cycle => cycle.table_id === table.id)
            .map(cycle => ({
              breatheTime: cycle.breathe_time,
              holdTime: cycle.hold_time,
              tapMode: cycle.tap_mode || false // Make sure tapMode is properly retrieved
            }));
          
          return {
            id: table.id,
            name: table.name,
            cycles: tableCycles.length > 0 ? tableCycles : [{ breatheTime: 60, holdTime: 60, tapMode: false }],
            createdAt: new Date(table.created_at).getTime()
          };
        });
        
        if (formattedTables.length > 0) {
          setTables(formattedTables);
        } else {
          // Create default tables if none were found
          console.log('No tables found, creating defaults');
          await createDefaultTablesForUser(user.id);
        }
      } catch (error) {
        console.error('Error loading tables:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTables();
  }, [user]);
  
  // Create default tables for a new user
  const createDefaultTablesForUser = async (userId: string) => {
    try {
      const results = await Promise.all(defaultTables.map(async (defaultTable) => {
        // Create table
        const { data: tableData, error: tableError } = await supabase
          .from('training_tables')
          .insert([{ name: defaultTable.name, user_id: userId }])
          .select('id, created_at')
          .single();
          
        if (tableError || !tableData) {
          console.error('Error creating default table:', tableError);
          return null;
        }
        
        // Create cycles
        const cyclesForInsert = defaultTable.cycles.map((cycle, index) => ({
          table_id: tableData.id,
          breathe_time: cycle.breatheTime,
          hold_time: cycle.holdTime,
          cycle_index: index,
          tap_mode: cycle.tapMode || false // Explicitly set tapMode (false for default tables)
        }));
        
        const { error: cyclesError } = await supabase
          .from('breath_cycles')
          .insert(cyclesForInsert);
          
        if (cyclesError) {
          console.error('Error creating default cycles:', cyclesError);
          return null;
        }
        
        return {
          id: tableData.id,
          name: defaultTable.name,
          cycles: defaultTable.cycles,
          createdAt: new Date(tableData.created_at).getTime()
        };
      }));
      
      const validTables = results.filter((table): table is TrainingTable => table !== null);
      
      if (validTables.length > 0) {
        setTables(validTables);
      }
    } catch (error) {
      console.error('Error creating default tables:', error);
    }
  };
  
  // Save tables to localStorage when they change (as backup)
  useEffect(() => {
    localStorage.setItem('trainingTables', JSON.stringify(tables));
  }, [tables]);
  
  const createTable = async (name: string, cycles: BreathCycle[]): Promise<TrainingTable> => {
    if (user) {
      try {
        setLoading(true);
        
        // Create the table in Supabase
        const { data: tableData, error: tableError } = await supabase
          .from('training_tables')
          .insert([
            { name, user_id: user.id }
          ])
          .select('id, created_at')
          .single();
        
        if (tableError) {
          console.error('Error creating table:', tableError);
          throw new Error(tableError.message);
        }
        
        // Create the cycles for this table
        const cyclesForInsert = cycles.map((cycle, index) => ({
          table_id: tableData.id,
          breathe_time: cycle.breatheTime,
          hold_time: cycle.holdTime,
          cycle_index: index,
          tap_mode: cycle.tapMode || false // Include the tapMode property
        }));
        
        const { error: cyclesError } = await supabase
          .from('breath_cycles')
          .insert(cyclesForInsert);
        
        if (cyclesError) {
          console.error('Error creating cycles:', cyclesError);
          throw new Error(cyclesError.message);
        }
        
        // Create the new table object
        const newTable: TrainingTable = {
          id: tableData.id,
          name,
          cycles,
          createdAt: new Date(tableData.created_at).getTime(),
        };
        
        setTables(prev => [newTable, ...prev]);
        return newTable;
      } catch (error) {
        console.error('Error in createTable:', error);
        
        // Fallback to local storage if database fails
        const newTable: TrainingTable = {
          id: generateId(),
          name,
          cycles,
          createdAt: Date.now(),
        };
        
        setTables(prev => [newTable, ...prev]);
        return newTable;
      } finally {
        setLoading(false);
      }
    } else {
      // Not logged in, use localStorage only
      const newTable: TrainingTable = {
        id: generateId(),
        name,
        cycles,
        createdAt: Date.now(),
      };
      
      setTables(prev => [newTable, ...prev]);
      return newTable;
    }
  };
  
  const updateTable = async (id: string, data: Partial<TrainingTable>) => {
    if (user) {
      try {
        setLoading(true);
        
        // Update the table name if needed
        if (data.name) {
          const { error: tableError } = await supabase
            .from('training_tables')
            .update({ name: data.name })
            .eq('id', id)
            .eq('user_id', user.id);
          
          if (tableError) {
            console.error('Error updating table:', tableError);
            throw new Error(tableError.message);
          }
        }
        
        // Update cycles if needed
        if (data.cycles) {
          // First delete all existing cycles for this table
          const { error: deleteError } = await supabase
            .from('breath_cycles')
            .delete()
            .eq('table_id', id);
          
          if (deleteError) {
            console.error('Error deleting cycles:', deleteError);
            throw new Error(deleteError.message);
          }
          
          // Insert the new cycles
          const cyclesForInsert = data.cycles.map((cycle, index) => ({
            table_id: id,
            breathe_time: cycle.breatheTime,
            hold_time: cycle.holdTime,
            cycle_index: index,
            tap_mode: cycle.tapMode || false // Include the tapMode property
          }));
          
          const { error: insertError } = await supabase
            .from('breath_cycles')
            .insert(cyclesForInsert);
          
          if (insertError) {
            console.error('Error inserting new cycles:', insertError);
            throw new Error(insertError.message);
          }
        }
        
        // Update the local state
        setTables(prev => prev.map(table => 
          table.id === id ? { ...table, ...data } : table
        ));
      } catch (error) {
        console.error('Error in updateTable:', error);
        
        // Update local state anyway as fallback
        setTables(prev => prev.map(table => 
          table.id === id ? { ...table, ...data } : table
        ));
      } finally {
        setLoading(false);
      }
    } else {
      // Not logged in, use localStorage only
      setTables(prev => prev.map(table => 
        table.id === id ? { ...table, ...data } : table
      ));
    }
  };
  
  const deleteTable = async (id: string) => {
    if (user) {
      try {
        setLoading(true);
        
        // Delete the table from Supabase (cascade will delete cycles)
        const { error } = await supabase
          .from('training_tables')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error deleting table:', error);
          throw new Error(error.message);
        }
        
        // Update local state
        setTables(prev => prev.filter(table => table.id !== id));
        if (activeTable?.id === id) {
          setActiveTable(null);
        }
      } catch (error) {
        console.error('Error in deleteTable:', error);
        
        // Update local state anyway as fallback
        setTables(prev => prev.filter(table => table.id !== id));
        if (activeTable?.id === id) {
          setActiveTable(null);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Not logged in, use localStorage only
      setTables(prev => prev.filter(table => table.id !== id));
      if (activeTable?.id === id) {
        setActiveTable(null);
      }
    }
  };
  
  const getTable = (id: string) => {
    return tables.find(table => table.id === id);
  };
  
  const value = {
    tables,
    activeTable,
    loading,
    setActiveTable,
    createTable,
    updateTable,
    deleteTable,
    getTable,
  };
  
  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
};

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};
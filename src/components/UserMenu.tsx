import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const UserMenu: React.FC = () => {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-ocean-300 hover:text-ocean-100 py-1 px-2 rounded-lg"
        aria-expanded={isOpen}
      >
        <User size={18} />
        <span className="text-sm hidden sm:inline">{user.email}</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-2 bg-ocean-800 border border-ocean-700 rounded-lg shadow-xl z-50">
          <div className="px-4 py-2 border-b border-ocean-700">
            <p className="text-ocean-300 text-xs">Logged in as</p>
            <p className="text-ocean-100 text-sm truncate">{user.email}</p>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-ocean-700 hover:text-red-300 w-full text-left text-sm"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
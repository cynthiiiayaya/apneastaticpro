import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Settings as SettingsIcon, History } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import { useUser } from '../contexts/UserContext';
import UserMenu from './UserMenu';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { phase } = useTimer();
  const { user } = useUser();
  
  // Hide settings link during active session
  const isTimerActive = phase !== 'idle' && phase !== 'complete';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-900 to-ocean-950 text-white">
      <header className="bg-ocean-800/50 backdrop-blur-sm border-b border-ocean-700/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <Compass size={32} className="text-seagreen-400" />
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-seagreen-400">Apnea</span>Static
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-ocean-200 hidden sm:block">Freediving Breath Hold Trainer</div>
            <div className="flex items-center gap-2">
              {!user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-seagreen-600 hover:bg-seagreen-500 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Start Now
                </button>
              ) : (
                !isTimerActive && (
                  <>
                    <Link 
                      to="/history"
                      className="p-2 rounded-full bg-ocean-800 hover:bg-ocean-700 transition-colors"
                      aria-label="History"
                    >
                      <History size={20} className="text-ocean-300" />
                    </Link>
                    <Link 
                      to="/settings"
                      className="p-2 rounded-full bg-ocean-800 hover:bg-ocean-700 transition-colors"
                      aria-label="Settings"
                    >
                      <SettingsIcon size={20} className="text-ocean-300" />
                    </Link>
                  </>
                )
              )}
              {user && <UserMenu />}
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-ocean-900/50 border-t border-ocean-800/30 mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-ocean-400 text-sm">
          <p>ApneaStatic &copy; {new Date().getFullYear()} - Freediving Breath Hold Trainer</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
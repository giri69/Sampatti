import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, PieChart, FileText, Users, Bell, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) {
      setPageTitle('Dashboard');
    } else if (path.includes('/investments')) {
      setPageTitle('Investments');
    } else if (path.includes('/documents')) {
      setPageTitle('Documents');
    } else if (path.includes('/nominees')) {
      setPageTitle('Nominees');
    } else if (path.includes('/alerts')) {
      setPageTitle('Alerts');
    } else if (path.includes('/settings')) {
      setPageTitle('Settings');
    }
  }, [location]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser || !currentUser.name) return 'U';
    
    const nameParts = currentUser.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      {/* Mobile Header */}
      <header className="md:hidden bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400">Sampatti</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-700"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:w-64 bg-gray-800 border-r border-gray-700 flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-indigo-400">Sampatti</h1>
            <p className="text-sm text-gray-400 mt-1">Investment Management</p>
          </div>
          
          <nav className="px-4 py-2 flex-1">
            <ul>
              <li className="mb-2">
                <NavLink 
                  to="/dashboard" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <Home size={20} className="mr-3" />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li className="mb-2">
                <NavLink 
                  to="/investments" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <PieChart size={20} className="mr-3" />
                  <span>Investments</span>
                </NavLink>
              </li>
              <li className="mb-2">
                <NavLink 
                  to="/documents" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <FileText size={20} className="mr-3" />
                  <span>Documents</span>
                </NavLink>
              </li>
              <li className="mb-2">
                <NavLink 
                  to="/nominees" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <Users size={20} className="mr-3" />
                  <span>Nominees</span>
                </NavLink>
              </li>
              <li className="mb-2">
                <NavLink 
                  to="/alerts" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <Bell size={20} className="mr-3" />
                  <span>Alerts</span>
                </NavLink>
              </li>
              <li className="mb-2">
                <NavLink 
                  to="/settings" 
                  className={({isActive}) => 
                    isActive 
                      ? "flex items-center p-3 rounded-lg bg-indigo-600 text-white" 
                      : "flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300"
                  }
                >
                  <Settings size={20} className="mr-3" />
                  <span>Settings</span>
                </NavLink>
              </li>
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-700">
            <button 
              onClick={handleLogout}
              className="flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300 w-full"
            >
              <LogOut size={20} className="mr-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 z-50 bg-gray-900 pt-16">
            <nav className="px-4 py-2">
              <ul>
                <li className="mb-2">
                  <NavLink 
                    to="/dashboard" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <Home size={20} className="mr-3" />
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li className="mb-2">
                  <NavLink 
                    to="/investments" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <PieChart size={20} className="mr-3" />
                    <span>Investments</span>
                  </NavLink>
                </li>
                <li className="mb-2">
                  <NavLink 
                    to="/documents" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <FileText size={20} className="mr-3" />
                    <span>Documents</span>
                  </NavLink>
                </li>
                <li className="mb-2">
                  <NavLink 
                    to="/nominees" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <Users size={20} className="mr-3" />
                    <span>Nominees</span>
                  </NavLink>
                </li>
                <li className="mb-2">
                  <NavLink 
                    to="/alerts" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <Bell size={20} className="mr-3" />
                    <span>Alerts</span>
                  </NavLink>
                </li>
                <li className="mb-2">
                  <NavLink 
                    to="/settings" 
                    className={({isActive}) => 
                      isActive 
                        ? "flex items-center p-4 rounded-lg bg-indigo-600 text-white" 
                        : "flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300"
                    }
                  >
                    <Settings size={20} className="mr-3" />
                    <span>Settings</span>
                  </NavLink>
                </li>
                <li className="mt-6">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center p-4 rounded-lg hover:bg-gray-700 text-gray-300 w-full"
                  >
                    <LogOut size={20} className="mr-3" />
                    <span>Log out</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">{pageTitle}</h2>
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/alerts" 
                className={({isActive}) => 
                  isActive 
                    ? "relative p-2 rounded-full bg-indigo-600 text-white" 
                    : "relative p-2 rounded-full hover:bg-gray-700 text-gray-300"
                }
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </NavLink>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {getUserInitials()}
                </div>
                <span className="ml-2 hidden md:inline-block">{currentUser?.name || 'User'}</span>
              </div>
            </div>
          </header>

          {/* Content Area - Outlet for nested routes */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
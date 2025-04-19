import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, PieChart, FileText, Users, Bell, Settings, LogOut } from 'lucide-react';

const MainLayout = () => {
  const navigate = useNavigate();

  // This would be connected to your authentication logic
  const handleLogout = () => {
    // Clear auth tokens/state
    // localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-400">Sampatti</h1>
          <p className="text-sm text-gray-400 mt-1">Investment Management</p>
        </div>
        
        <nav className="px-4 py-2">
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
        
        <div className="px-4 py-2 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center p-3 rounded-lg hover:bg-gray-700 text-gray-300 w-full"
          >
            <LogOut size={20} className="mr-3" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-700">
              <Bell size={20} />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                JS
              </div>
              <span className="ml-2">John Smith</span>
            </div>
          </div>
        </header>

        {/* Content Area - Outlet for nested routes */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
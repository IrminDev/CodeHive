import React, { useState } from "react";
import { Link } from "react-router";
import { 
  Menu, 
  Bell, 
  Settings, 
  Sun, 
  Moon, 
  Code2, 
  Home, 
  ClipboardList, 
  Archive,
  X
} from "lucide-react";
import { useAuth } from "~/core/providers/AuthProvider";
import { useTheme } from "~/core/providers/ThemeProvider";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
      {/* Navbar */}
      <header className="h-16 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSidebar}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-md transition-colors sm:hidden"
          >
            <Menu size={20} />
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2 text-azure dark:text-yellow font-semibold text-lg">
            <Code2 size={24} />
            <span className="text-gray-900 dark:text-white hidden sm:inline-block">CodeHive</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 ml-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link to="/dashboard" className="hover:text-azure dark:hover:text-white transition-colors">My Groups</Link>
            <Link to="/courses" className="hover:text-azure dark:hover:text-white transition-colors">Courses</Link>
            <Link to="/grades" className="hover:text-azure dark:hover:text-white transition-colors">Grades</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors hidden sm:block"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-azure dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors">
            <Settings size={20} />
          </button>
          
          <div className="h-8 w-px bg-gray-200 dark:bg-[#2a2a2a] mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">{user?.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase() || 'Student'}</span>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="h-10 w-10 rounded-full bg-azure dark:bg-yellow flex items-center justify-center font-bold text-lg text-white dark:text-dark-bg overflow-hidden border-2 border-transparent hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-azure dark:focus:ring-yellow focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1a1a1a]"
            >
              {user?.profilePictureUrl && user.profilePictureUrl !== "/static/images/default-avatar.png" ? (
                <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0) || 'U'}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 sm:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed sm:static inset-y-0 left-0 w-64 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#2a2a2a] transform transition-all duration-300 z-50 flex flex-col
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0 sm:w-20 lg:w-64'}`}
        >
          <div className="p-4 flex items-center justify-between sm:hidden border-b border-gray-200 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2 text-azure dark:text-yellow font-semibold">
              <Code2 size={24} />
              <span className="text-gray-900 dark:text-white">CodeHive</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md">
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 flex flex-col gap-2 flex-1">
            <SidebarItem icon={<Home size={22} />} label="Inicio" to="/dashboard" active />
            <SidebarItem icon={<ClipboardList size={22} />} label="Tareas pendientes" to="/tasks" />
            <SidebarItem icon={<Archive size={22} />} label="Clases archivadas" to="/archived" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

      <ProfileSettingsModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

const SidebarItem = ({ icon, label, to, active = false }: { icon: React.ReactNode, label: string, to: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group
      ${active ? 'bg-blue-50 dark:bg-yellow/10 text-azure dark:text-yellow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-white'}`}
  >
    <div className={`${active ? 'text-azure dark:text-yellow' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
      {icon}
    </div>
    <span className={`font-medium sm:hidden lg:block ${active ? 'text-gray-900 dark:text-white' : ''}`}>{label}</span>
  </Link>
);

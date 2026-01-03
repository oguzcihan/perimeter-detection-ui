
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaChartLine, FaCogs, FaSignOutAlt, FaVideo } from 'react-icons/fa';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarItems = [
        { label: t('sidebar.dashboard'), icon: <FaChartLine />, path: '/dashboard' },
        { label: t('sidebar.video_roi'), icon: <FaVideo />, path: '/dashboard/video-roi' },
        { label: t('sidebar.settings'), icon: <FaCogs />, path: '/dashboard/settings' },
        { label: t('sidebar.statistics'), icon: <FaChartLine />, path: '/dashboard/statistics' },
        { label: t('sidebar.live_feeds'), icon: <FaVideo />, path: '/dashboard/feeds' },
        { label: t('sidebar.system_status'), icon: <FaShieldAlt />, path: '/dashboard/system' },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl z-20">
                <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-900/50">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-wider">
                        <FaShieldAlt className="text-2xl" />
                        <span>PERIMETER<span className="text-white">OS</span></span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={classNames(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                                location.pathname === item.path
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                            )}
                        >
                            <span className={classNames("text-lg", location.pathname === item.path ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700 bg-slate-900/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            {user && user.username ? user.username.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.username || 'Admin'}</p>
                            <p className="text-xs text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </p>
                        </div>

                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium border border-red-500/20"
                    >
                        <FaSignOutAlt />
                        {t('sidebar.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>
                <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>

                {/* Top Header */}
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <span className="text-emerald-500">I/O</span> Secure Dashboard
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 text-xs px-3 py-1 rounded border border-slate-600 font-mono text-emerald-400">
                            {t('status.normal')}
                        </div>
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 z-10 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

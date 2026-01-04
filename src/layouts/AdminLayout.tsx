
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaChartLine, FaCogs, FaVideo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { SidebarUserMenu } from '../components/SidebarUserMenu';
import { Footer } from '../components/Footer';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

    // Close sidebar on route change on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true); // Default to collapsed on mobile
            } else {
                setIsSidebarCollapsed(false);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar when clicking a link on mobile
    const handleSideItemClick = (path: string) => {
        navigate(path);
        if (window.innerWidth < 1024) {
            setIsSidebarCollapsed(true);
        }
    }

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {/* Mobile Backdrop */}
            {!isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={classNames(
                    "bg-slate-800 border-r border-slate-700 flex flex-col shadow-2xl z-40 transition-all duration-300 ease-in-out",
                    // Mobile: Fixed position, sliding drawer
                    "fixed inset-y-0 left-0 h-full",
                    // Desktop: Relative flex item
                    "lg:static lg:h-screen",
                    isSidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-64"
                )}
            >
                {/* Toggle Button - Desktop Only usually, but let's keep it visible or add a mobile toggle in header */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-20 bg-slate-700 border border-slate-600 text-slate-300 rounded-full p-1.5 shadow-md hover:bg-slate-600 hover:text-white transition-colors z-30 transform hover:scale-110 hidden lg:block"
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isSidebarCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
                </button>

                <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-900/50 overflow-hidden relative">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl tracking-wider whitespace-nowrap">
                        <FaShieldAlt className="text-2xl min-w-[24px]" />
                        <span className={classNames("transition-opacity duration-200", isSidebarCollapsed && window.innerWidth >= 1024 ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                            PERIMETER<span className="text-white">OS</span>
                        </span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 lg:hidden p-2"
                        onClick={() => setIsSidebarCollapsed(true)}
                    >
                        <FaChevronLeft />
                    </button>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-2 overflow-x-hidden overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => handleSideItemClick(item.path)}
                            title={isSidebarCollapsed && window.innerWidth >= 1024 ? item.label : undefined}
                            className={classNames(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                                location.pathname === item.path
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200",
                                isSidebarCollapsed && window.innerWidth >= 1024 ? "justify-center" : "justify-start"
                            )}
                        >
                            <span className={classNames(
                                "text-lg flex-shrink-0 transition-colors duration-200",
                                location.pathname === item.path ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                            )}>
                                {item.icon}
                            </span>
                            <span className={classNames(
                                "whitespace-nowrap transition-all duration-200 origin-left",
                                isSidebarCollapsed && window.innerWidth >= 1024 ? "hidden opacity-0 w-0" : "block opacity-100"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto">
                    <SidebarUserMenu user={user} isCollapsed={isSidebarCollapsed && window.innerWidth >= 1024} onLogout={handleLogout} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300 w-full">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>
                <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-900 via-transparent to-slate-900"></div>

                {/* Top Header */}
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            className="text-slate-300 lg:hidden p-1 mr-2"
                            onClick={() => setIsSidebarCollapsed(false)}
                        >
                            <FaChevronRight size={20} />
                        </button>

                        <div className="text-lg font-semibold text-slate-100 uppercase tracking-widest flex items-center gap-2 truncate">
                            <span className="text-emerald-500">I/O</span> <span className="hidden xs:inline">Secure Dashboard</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="hidden xs:block bg-slate-800 text-xs px-3 py-1 rounded border border-slate-600 font-mono text-emerald-400">
                            {t('status.normal')}
                        </div>
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 custom-scrollbar flex flex-col">
                    <div className="flex-1">
                        <Outlet />
                    </div>
                    <Footer className="mt-8 border-t border-slate-800/50 pt-4" />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaChevronUp } from 'react-icons/fa';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

interface SidebarUserMenuProps {
    user: any;
    isCollapsed: boolean;
    onLogout: () => void;
}

export const SidebarUserMenu: React.FC<SidebarUserMenuProps> = ({ user, isCollapsed, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Close menu when clicking outside
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

    // Close menu when sidebar collapse state changes to avoid layout issues
    useEffect(() => {
        setIsOpen(false);
    }, [isCollapsed]);

    const username = user?.username || 'Admin User';
    const initial = username.charAt(0).toUpperCase();

    const menuItems = [
        { label: 'Edit profile', icon: <FaUser size={14} />, action: () => navigate('/dashboard/edit-profile') },
    ];

    return (
        <div className="border-t border-slate-700 bg-slate-900/30 relative" ref={menuRef}>
            {/* Menu Popup */}
            {isOpen && (
                <div
                    className={classNames(
                        "absolute z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[240px] transition-all duration-200 ease-out transform origin-bottom-left",
                        isCollapsed
                            ? "left-full bottom-0 ml-4 mb-2" // Side popup when collapsed
                            : "bottom-full left-0 w-full mb-3" // Upward popup when expanded
                    )}
                >
                    {/* Items */}
                    <div className="p-2 space-y-1">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.action();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                            >
                                <span className="text-slate-400">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-slate-700 my-1 mx-2"></div>

                    {/* Logout */}
                    <div className="p-2">
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                            <FaSignOutAlt size={14} />
                            {t('sidebar.logout')}
                        </button>
                    </div>
                </div>
            )}

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={classNames(
                    "w-full flex items-center p-3 hover:bg-slate-800 transition-colors focus:outline-none",
                    isCollapsed ? "justify-center" : "justify-between gap-3"
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Avatar */}
                    <div className={classNames(
                        "w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-slate-800 flex-shrink-0",
                        isCollapsed ? "mx-auto" : ""
                    )}>
                        {initial}
                    </div>

                    {/* User Info (Hidden if collapsed) */}
                    {!isCollapsed && (
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium text-slate-200 truncate leading-none mb-1">{username}</p>
                            <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Online</p>
                        </div>
                    )}
                </div>

                {/* Chevron (Hidden if collapsed) */}
                {!isCollapsed && (
                    <div className={classNames("text-slate-500 transition-transform duration-200", isOpen ? "rotate-180" : "")}>
                        <FaChevronUp size={12} />
                    </div>
                )}
            </button>
        </div>
    );
};

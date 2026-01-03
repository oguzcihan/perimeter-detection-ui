import React from 'react';
import { FaBell, FaCamera, FaServer, FaExclamationTriangle, FaVideo } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const StatCard = ({ title, value, label, icon, color }: { title: string, value: string, label: string, icon: React.ReactNode, color: 'emerald' | 'amber' | 'red' | 'blue' }) => {
    const colorClasses = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    return (
        <div className={`p-6 rounded-xl border backdrop-blur-sm ${colorClasses[color]} flex items-start justify-between group hover:scale-[1.02] transition-transform duration-300`}>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{title}</p>
                <h3 className="text-3xl font-bold font-mono">{value}</h3>
                <p className="text-xs mt-2 opacity-60 flex items-center gap-1">
                    {icon} {label}
                </p>
            </div>
            <div className={`p-3 rounded-lg bg-slate-900/30 ${color === 'red' ? 'animate-pulse' : ''}`}>
                {/* @ts-expect-error - React.cloneElement type definitions are strict */}
                {React.cloneElement(icon as React.ReactElement, { className: "text-2xl" })}
            </div>
        </div>
    );
};

const FeedCard = ({ id, status, location }: { id: string, status: 'Active' | 'Offline' | 'Alert', location: string }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
        <div className="relative bg-black h-48 flex items-center justify-center group">
            <div className="absolute inset-0 flex items-center justify-center opacity-30 text-slate-500">
                <FaCamera className="text-5xl" />
            </div>
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-bold bg-black/60 border border-white/10 backdrop-blur-md">
                CAM-{id}
            </div>
            <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : status === 'Alert' ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></div>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-xs font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors">
                LIVE FEED :: {location}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t('dashboard.title')}</h1>
                    <p className="text-slate-400 text-sm">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-emerald-500/20">
                        {t('dashboard.health_check')}
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition-colors">
                        {t('dashboard.generate_report')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={t('dashboard.active_cameras')}
                    value="24/24"
                    label={t('dashboard.all_nominal')}
                    icon={<FaCamera />}
                    color="emerald"
                />
                <StatCard
                    title={t('dashboard.intrusions')}
                    value="02"
                    label={t('dashboard.last_24h')}
                    icon={<FaExclamationTriangle />}
                    color="red"
                />
                <StatCard
                    title={t('dashboard.uptime')}
                    value="99.9%"
                    label={t('dashboard.continuous')}
                    icon={<FaServer />}
                    color="blue"
                />
                <StatCard
                    title={t('dashboard.active_alerts')}
                    value="0"
                    label={t('dashboard.no_threats')}
                    icon={<FaBell />}
                    color="amber"
                />
            </div>

            {/* Main Section - Vertical Stack */}
            <div className="space-y-6">
                {/* Live Feeds Area - Full Width */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FaVideo className="text-emerald-500" /> {t('dashboard.live_surveillance')}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FeedCard id="01" status="Active" location="North Gate Entrance" />
                        <FeedCard id="02" status="Active" location="East Perimeter Fence" />
                        <FeedCard id="03" status="Active" location="Loading Dock A" />
                        <FeedCard id="04" status="Alert" location="South Sector 4 (Motion)" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;

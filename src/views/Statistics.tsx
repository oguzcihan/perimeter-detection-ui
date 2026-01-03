import { useState, useEffect, useMemo } from "react";
import { FaTrash, FaExclamationTriangle, FaVideo, FaCamera, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { statsService, type DashboardStats, type LogEntry } from "../services/statsService";
import { toast } from "react-toastify";
import { DataTable, type Column } from "../components/DataTable";

// Custom Modal Component since we aren't using Reactstrap
const ConfirmModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) => {
    if (!isOpen) return null;
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">{t('statistics.confirm_reset_title')}</h3>
                <p className="text-slate-300 mb-6">{t('statistics.confirm_reset_message')}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                    >
                        {t('common.confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Statistics() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats>(statsService.getStats());
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        // Poll for updates every few seconds or just on mount
        const interval = setInterval(() => {
            setStats(statsService.getStats());
        }, 5000); // 5s poll due to local storage

        return () => clearInterval(interval);
    }, []);

    const toggleModal = () => setModalOpen(!modalOpen);

    const handleReset = () => {
        statsService.resetStats();
        setStats(statsService.getStats());
        toast.success(t('statistics.reset_success'));
        toggleModal();
    };

    const getBadgeColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'alarm': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'detection': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'; // info -> emerald
            case 'video_session': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'camera_session': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getTypeIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'alarm': return <FaExclamationTriangle className="inline mr-1" />;
            case 'detection': return <FaVideo className="inline mr-1" />;
            case 'video_session': return <FaVideo className="inline mr-1" />;
            case 'camera_session': return <FaCamera className="inline mr-1" />;
            default: return <FaInfoCircle className="inline mr-1" />;
        }
    }

    const formatType = (type: string) => {
        return type.replace('_', ' ').toUpperCase();
    };

    const columns = useMemo<Column<LogEntry>[]>(() => [
        {
            header: t('statistics.timestamp'),
            cell: (row) => (
                <span className="font-mono opacity-80">
                    {new Date(row.timestamp).toLocaleString()}
                </span>
            ),
            className: "whitespace-nowrap w-48"
        },
        {
            header: t('statistics.type'),
            cell: (row) => (
                <span className={`px-2 py-1 rounded text-xs font-bold border ${getBadgeColor(row.type)}`}>
                    {getTypeIcon(row.type)} {formatType(row.type)}
                </span>
            ),
            className: "whitespace-nowrap w-40"
        },
        {
            header: t('statistics.details'),
            accessorKey: 'details',
            className: "font-medium"
        }
    ], [t]);

    const sortedLogs = useMemo(() => {
        return [...(stats.logs || [])].reverse();
    }, [stats.logs]);

    return (
        <div className="space-y-6">
            <ConfirmModal isOpen={modalOpen} onClose={toggleModal} onConfirm={handleReset} />

            <div className="flex items-end justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t('statistics.title')}</h1>
                    <p className="text-slate-400 text-sm">{t('statistics.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleModal}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-lg transition-colors"
                    >
                        <FaTrash /> {t('statistics.reset_stats')}
                    </button>
                </div>
            </div>

            <DataTable
                data={sortedLogs}
                columns={columns}
                pageSizeOptions={[10, 25, 50, 100]}
                defaultPageSize={10}
                emptyMessage={t('statistics.no_logs')}
            />
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { FaCog, FaInfoCircle, FaSave, FaServer } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import api from "../services/api";

// Define the shape of our configuration based on backend Pydantic model
interface SystemConfig {
    confidence_threshold: number;
    alarm_threshold_meters: number;
    focal_length: number;
    breach_threshold_frames: number;
}

export default function Settings() {
    const { t } = useTranslation();
    const [config, setConfig] = useState<SystemConfig>({
        confidence_threshold: 0.25,
        alarm_threshold_meters: 1.5,
        focal_length: 850,
        breach_threshold_frames: 15
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Load current settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get<SystemConfig>("/api/v1/config");
            setConfig(response.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error(t('settings.error_fetch'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig((prev) => ({
            ...prev,
            [name]: parseFloat(value), // Ensure numbers are sent as numbers
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post("/api/v1/config", config);
            toast.success(t('settings.success_update'));
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error(t('settings.error_update'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t('settings.title')}</h1>
                    <p className="text-slate-400 text-sm">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Configuration Form */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
                            <FaCog className="text-emerald-500 text-xl" />
                            <h3 className="font-semibold text-white m-0 leading-none">{t('settings.detection_params')}</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSave}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Confidence Threshold */}
                                    <div className="space-y-2">
                                        <label htmlFor="confidence_threshold" className="block text-sm font-medium text-slate-300">
                                            {t('settings.confidence_threshold')}
                                        </label>
                                        <input
                                            id="confidence_threshold"
                                            name="confidence_threshold"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            value={config.confidence_threshold}
                                            onChange={handleInputChange}
                                        />
                                        <p className="text-xs text-slate-500">
                                            {t('settings.confidence_desc')}
                                        </p>
                                    </div>

                                    {/* Alarm Distance */}
                                    <div className="space-y-2">
                                        <label htmlFor="alarm_threshold_meters" className="block text-sm font-medium text-slate-300">
                                            {t('settings.alarm_distance')}
                                        </label>
                                        <input
                                            id="alarm_threshold_meters"
                                            name="alarm_threshold_meters"
                                            type="number"
                                            step="0.1"
                                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            value={config.alarm_threshold_meters}
                                            onChange={handleInputChange}
                                        />
                                        <p className="text-xs text-slate-500">
                                            {t('settings.alarm_desc')}
                                        </p>
                                    </div>

                                    {/* Focal Length */}
                                    <div className="space-y-2">
                                        <label htmlFor="focal_length" className="block text-sm font-medium text-slate-300">
                                            {t('settings.focal_length')}
                                        </label>
                                        <input
                                            id="focal_length"
                                            name="focal_length"
                                            type="number"
                                            step="1"
                                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            value={config.focal_length}
                                            onChange={handleInputChange}
                                        />
                                        <p className="text-xs text-slate-500">
                                            {t('settings.focal_desc')}
                                        </p>
                                    </div>

                                    {/* Breach Threshold */}
                                    <div className="space-y-2">
                                        <label htmlFor="breach_threshold_frames" className="block text-sm font-medium text-slate-300">
                                            {t('settings.breach_threshold')}
                                        </label>
                                        <input
                                            id="breach_threshold_frames"
                                            name="breach_threshold_frames"
                                            type="number"
                                            step="1"
                                            min="1"
                                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            value={config.breach_threshold_frames}
                                            onChange={handleInputChange}
                                        />
                                        <p className="text-xs text-slate-500">
                                            {t('settings.breach_desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                {t('common.saving')}
                                            </>
                                        ) : (
                                            <>
                                                <FaSave /> {t('common.save')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex items-center gap-3">
                            <FaInfoCircle className="text-blue-400 text-xl" />
                            <h3 className="font-semibold text-white m-0 leading-none">{t('settings.calibration_guide')}</h3>
                        </div>
                        <div className="p-6 text-sm text-slate-300 space-y-4">
                            <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
                                <strong className="block text-emerald-400 mb-1">{t('settings.focal_guide')}</strong>
                                {t('settings.focal_guide_text')}
                            </div>
                            <div className="p-3 rounded bg-slate-900/50 border border-slate-700/50">
                                <strong className="block text-emerald-400 mb-1">{t('settings.confidence_guide')}</strong>
                                {t('settings.confidence_guide_text')}
                            </div>
                            <div className="flex items-start gap-2 text-xs text-slate-500 mt-2">
                                <FaServer className="mt-0.5" />
                                <span>{t('settings.changes_apply')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe } from 'react-icons/fa';

export const LanguageSwitcher = ({ direction = 'down' }: { direction?: 'up' | 'down' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
    ];

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.language-switcher-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const dropdownPosition = direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';

    return (
        <div className="relative language-switcher-container">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-colors text-xs text-slate-200"
                title="Change Language"
            >
                <FaGlobe className="text-emerald-500" />
                <span className="font-mono">{currentLang.code.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div className={`absolute right-0 ${dropdownPosition} w-40 rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-50`}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full text-left px-4 py-1 text-sm hover:bg-slate-700 transition-colors flex items-center gap-3
                                ${i18n.language === lang.code ? 'bg-slate-700/50 text-emerald-400 font-medium' : 'text-slate-300'}
                            `}
                        >
                            <span className="text-lg">{lang.flag}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

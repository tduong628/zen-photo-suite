
import React from 'react';
import { Language } from '../constants';
import { View } from '../types';
import Icon from './icons';

interface HeaderProps {
    currentLang: Language;
    onSetLang: (lang: Language) => void;
    onGoHome: () => void;
    currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentLang, onSetLang, onGoHome, currentView }) => {
    const languages: Language[] = ['EN', 'ES', 'VI'];
    const isHome = currentView === View.MainMenu;

    return (
        <header
            className="glass-panel sticky top-0 z-40"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="max-w-2xl mx-auto px-4 sm:px-5 flex justify-between items-center" style={{ height: '60px' }}>
                <div className="flex items-center gap-1 min-w-0">
                    {!isHome && (
                        <button
                            onClick={onGoHome}
                            aria-label="Back to Home"
                            className="ios-btn-press flex items-center justify-center flex-shrink-0"
                            style={{ width: '44px', height: '44px', marginLeft: '-10px', color: 'var(--color-ink)' }}
                        >
                            <Icon name="chevronLeft" className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onGoHome} className="ios-btn-press flex items-center gap-2 min-w-0" aria-label="Go home">
                        <img
                            src={`${import.meta.env.BASE_URL}logo.png`}
                            alt="Zen Nail Spa"
                            className="flex-shrink-0 h-7 w-auto object-contain"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(33,28,23,0.10))' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="flex flex-col items-start leading-none min-w-0">
                            <span
                                className="font-display truncate"
                                style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ink)' }}
                            >
                                Zen Nail Spa
                            </span>
                            {/* Jade micro-accent (spec §1c) — header logo tint, one of the two allowed surfaces */}
                            <span style={{ width: '20px', height: '2px', marginTop: '2px', background: 'var(--color-accent-2)', opacity: 0.6, borderRadius: '2px' }} />
                        </div>
                    </button>
                </div>

                {/* Language switcher */}
                <div
                    className="flex items-center p-1 gap-0.5 flex-shrink-0"
                    style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '9999px',
                    }}
                >
                    {languages.map(lang => {
                        const isActive = currentLang === lang;
                        return (
                            <button
                                key={lang}
                                onClick={() => onSetLang(lang)}
                                className="ios-btn-press"
                                style={{
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '9999px',
                                    fontSize: 'var(--text-label)',
                                    fontWeight: 600,
                                    letterSpacing: '0.05em',
                                    color: isActive ? 'var(--color-accent-dark)' : 'var(--color-ink-soft)',
                                    background: 'transparent',
                                    transition: `color var(--dur-fast) ease`,
                                }}
                            >
                                {lang}
                            </button>
                        );
                    })}
                </div>
            </div>
        </header>
    );
};

export default Header;

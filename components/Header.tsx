
import React, { useState, useEffect } from 'react';
import { Language, protocolData } from '../constants';

interface HeaderProps {
    currentLang: Language;
    onSetLang: (lang: Language) => void;
    onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentLang, onSetLang, onGoHome }) => {
    const languages: Language[] = ['EN', 'ES', 'VI'];
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className="sticky top-0 z-40 transition-all duration-300"
            style={{
                background: scrolled ? 'rgba(253,244,249,0.88)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(243,213,232,0.6)' : '1px solid transparent',
            }}
        >
            <div className="max-w-2xl mx-auto px-5 h-[4.25rem] flex justify-between items-center">
                {/* Brand mark */}
                <button onClick={onGoHome} className="ios-btn-press flex items-center gap-3 group" aria-label="Go home">
                    {/* Diamond accent */}
                    <div
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, #0b5d56 100%)',
                            borderRadius: '0.6rem',
                            boxShadow: '0 2px 8px rgba(190,24,93,0.30)',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1.5L10.5 6.5L15.5 7.5L11.5 11.5L12.5 16.5L8 14L3.5 16.5L4.5 11.5L0.5 7.5L5.5 6.5L8 1.5Z" fill="white" opacity="0.9"/>
                        </svg>
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span
                            className="font-display text-[1.05rem] font-semibold leading-none tracking-tight"
                            style={{ color: 'var(--color-text)' }}
                        >
                            Zen Nail Spa
                        </span>
                        <span
                            className="section-label mt-[3px]"
                            style={{ color: 'var(--color-primary)', fontSize: '0.58rem' }}
                        >
                            Photo Suite
                        </span>
                    </div>
                </button>

                {/* Language switcher */}
                <div
                    className="flex items-center p-1 gap-0.5"
                    style={{
                        background: 'rgba(255,255,255,0.7)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '9999px',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    {languages.map(lang => {
                        const isActive = currentLang === lang;
                        return (
                            <button
                                key={lang}
                                onClick={() => onSetLang(lang)}
                                className="ios-btn-press transition-all duration-250"
                                style={{
                                    padding: '0.25rem 0.7rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                                    boxShadow: isActive ? '0 1px 4px rgba(190,24,93,0.3)' : 'none',
                                    transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
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

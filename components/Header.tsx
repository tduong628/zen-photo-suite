
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
                <button onClick={onGoHome} className="ios-btn-press flex items-center gap-2.5 group" aria-label="Go home">
                    {/* Zen wordmark logo (transparent PNG) */}
                    <img
                        src={`${import.meta.env.BASE_URL}logo.png`}
                        alt="Zen Nail Spa"
                        className="flex-shrink-0 h-11 w-auto object-contain"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(10,28,23,0.12))' }}
                    />
                    <span
                        className="section-label self-end mb-1.5"
                        style={{ color: 'var(--color-primary)', fontSize: '0.58rem' }}
                    >
                        Photo Suite
                    </span>
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


import React from 'react';
import { LanguagePack, View } from '../types';
import Icon from './icons';

interface MainMenuProps {
    langPack: LanguagePack;
    onNavigate: (view: View) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ langPack, onNavigate }) => {
    return (
        <div className="pb-10" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Hero title */}
            <div className="animate-stagger-1 px-1">
                <p className="section-label mb-2">Salon Marketing Suite</p>
                <h1
                    className="font-display leading-[1.1] tracking-tight"
                    style={{ fontSize: 'clamp(2.25rem, 7vw, 3rem)', color: 'var(--color-text)' }}
                >
                    Create content<br />
                    <em style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>like a pro.</em>
                </h1>
                <p style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>
                    AI-powered tools built for Zen Nail Spa.
                </p>
            </div>

            {/* Tool cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

                {/* Photo Branding card */}
                <button
                    onClick={() => onNavigate(View.Branding)}
                    className="animate-stagger-2 ios-btn-press group luxury-card text-left overflow-hidden"
                    style={{ width: '100%', aspectRatio: '16/9', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                    aria-label={langPack.cat5Title}
                >
                    {/* Background gradient */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #fbf7e8 0%, #f3ead0 55%, #e9dcb2 100%)',
                        borderRadius: 'inherit',
                    }} />
                    {/* Decorative orb */}
                    <div style={{
                        position: 'absolute', top: '-20%', right: '-10%',
                        width: '55%', paddingBottom: '55%',
                        background: 'radial-gradient(circle, rgba(233,223,162,0.5) 0%, transparent 70%)',
                        filter: 'blur(24px)',
                        pointerEvents: 'none',
                    }} />
                    {/* Thin rose line accent */}
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-lt) 100%)',
                        borderTopLeftRadius: 'var(--radius-card)',
                        borderBottomLeftRadius: 'var(--radius-card)',
                    }} />

                    {/* Icon */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '3.25rem', height: '3.25rem',
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 12px rgba(190,24,93,0.14)',
                            border: '1px solid rgba(255,255,255,0.8)',
                        }}>
                            <span style={{ color: 'var(--color-primary)' }}>
                                <Icon name="branding" className="w-6 h-6" />
                            </span>
                        </div>
                    </div>

                    {/* Text + arrow */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p className="section-label" style={{ marginBottom: '0.375rem' }}>Tool 01</p>
                            <h2
                                className="font-display"
                                style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.15 }}
                            >
                                {langPack.cat5Title}
                            </h2>
                            <p style={{ marginTop: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                                {langPack.cat5Desc}
                            </p>
                        </div>
                        <div style={{
                            flexShrink: 0, marginLeft: '1rem',
                            width: '2.5rem', height: '2.5rem',
                            background: 'var(--color-primary)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(190,24,93,0.35)',
                            transition: 'transform 250ms var(--ease-spring)',
                        }}
                        className="group-hover:scale-110"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                </button>

                {/* Social Post card */}
                <button
                    onClick={() => onNavigate(View.Social)}
                    className="animate-stagger-3 ios-btn-press group luxury-card text-left overflow-hidden"
                    style={{ width: '100%', aspectRatio: '16/9', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                    aria-label={langPack.cat6Title}
                >
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #f7f2ea 0%, #ece2d2 55%, #ddcdb5 100%)',
                        borderRadius: 'inherit',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-20%', right: '-10%',
                        width: '60%', paddingBottom: '60%',
                        background: 'radial-gradient(circle, rgba(252,211,77,0.5) 0%, transparent 70%)',
                        filter: 'blur(28px)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                        background: 'linear-gradient(180deg, var(--color-accent) 0%, #8a6f4d 100%)',
                        borderTopLeftRadius: 'var(--radius-card)',
                        borderBottomLeftRadius: 'var(--radius-card)',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '3.25rem', height: '3.25rem',
                            background: 'rgba(255,255,255,0.9)',
                            borderRadius: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 12px rgba(124,58,237,0.14)',
                            border: '1px solid rgba(255,255,255,0.8)',
                        }}>
                            <span style={{ color: 'var(--color-accent)' }}>
                                <Icon name="social" className="w-6 h-6" />
                            </span>
                        </div>
                    </div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p className="section-label" style={{ marginBottom: '0.375rem', color: 'var(--color-accent)' }}>Tool 02</p>
                            <h2
                                className="font-display"
                                style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.15 }}
                            >
                                {langPack.cat6Title}
                            </h2>
                            <p style={{ marginTop: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                                {langPack.cat6Desc}
                            </p>
                        </div>
                        <div style={{
                            flexShrink: 0, marginLeft: '1rem',
                            width: '2.5rem', height: '2.5rem',
                            background: 'var(--color-accent)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
                            transition: 'transform 250ms var(--ease-spring)',
                        }}
                        className="group-hover:scale-110"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </div>
                    </div>
                </button>

            </div>

            {/* Footer tagline */}
            <p className="animate-stagger-3 text-center" style={{ color: 'var(--color-text-subtle)', fontSize: '0.7rem', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>
                Powered by Google Gemini AI
            </p>

        </div>
    );
};

export default MainMenu;

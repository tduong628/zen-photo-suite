
import React from 'react';

/**
 * One-shot splash screen (spec §4b, §5b), shown once per app boot before
 * Home mounts. CSS-only. Reduced-motion users never mount this component at
 * all — App.tsx gates `showSplash` on `prefers-reduced-motion` up front —
 * so there is no partially-animated frame to guard against here. Uses the
 * Zen mark on cream with a jade-tint glow behind it and Zen's snappier
 * easing.
 */
const Splash: React.FC = () => {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'var(--color-bg)' }}
        >
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    width: '55vw',
                    height: '55vw',
                    maxWidth: '420px',
                    maxHeight: '420px',
                    background: 'radial-gradient(circle, var(--color-accent-2-tint) 0%, transparent 70%)',
                    filter: 'blur(48px)',
                    animation: 'splash-glow 700ms ease-out forwards',
                }}
            />
            <div
                className="flex flex-col items-center"
                style={{ animation: 'splash-mark 420ms var(--ease-standard) forwards' }}
            >
                <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt="Zen Nail Spa"
                    style={{ width: 'min(160px, 42vw)', height: 'auto', objectFit: 'contain' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
        </div>
    );
};

export default Splash;

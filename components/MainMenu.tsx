
import React, { useEffect, useState } from 'react';
import { LanguagePack, View } from '../types';
import { fetchGallery, GalleryItem } from '../services/galleryService';
import { fetchStaffUploads } from '../services/staffInboxService';
import Icon from './icons';

interface MainMenuProps {
    langPack: LanguagePack;
    onNavigate: (view: View) => void;
}

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const todayLabel = (): string =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const MainMenu: React.FC<MainMenuProps> = ({ langPack, onNavigate }) => {
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [inboxCount, setInboxCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchGallery().then(items => {
            if (cancelled) return;
            setGalleryItems(items);
        });
        fetchStaffUploads().then(uploads => {
            if (cancelled) return;
            const salonUploads = uploads.filter(u => (u.salon || '').includes('Zen'));
            setInboxCount(salonUploads.filter(u => u.status === 'PENDING').length);
        });
        return () => { cancelled = true; };
    }, []);

    const previewThumb = galleryItems[0]?.thumbnailUrl ?? null;
    const galleryStrip = galleryItems.slice(0, 4);

    return (
        <div className="pb-10 mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '520px' }}>

            {/* Row 0 — greeting strip */}
            <div className="animate-stagger-1 px-1">
                <p className="section-label mb-1.5">{getGreeting().toUpperCase()}</p>
                <h1 className="font-display" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-ink)', lineHeight: 1.1 }}>
                    Zen Nail Spa
                </h1>
                <p style={{ marginTop: '0.35rem', color: 'var(--color-ink-soft)', fontSize: 'var(--text-caption)', fontWeight: 500 }}>
                    {todayLabel()}
                </p>
            </div>

            {/* Bento grid */}
            <div
                className="grid grid-cols-2 gap-3"
                style={{ gridTemplateAreas: `"a a" "a a" "b c" "d d"` }}
            >
                {/* Tile A — Photo Branding (hero, jade keyline) */}
                <button
                    onClick={() => onNavigate(View.Branding)}
                    className="animate-stagger-2 ios-btn-press luxury-card text-left overflow-hidden relative"
                    style={{
                        gridArea: 'a',
                        padding: '1.5rem',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(160deg, var(--color-accent-2-tint) 0%, var(--color-surface) 60%)',
                        border: '1px solid var(--color-accent-2)',
                        cursor: 'pointer',
                    }}
                    aria-label={langPack.cat5Title}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center justify-center flex-shrink-0"
                            style={{ width: '3rem', height: '3rem', borderRadius: '1rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-accent)' }}><Icon name="branding" className="w-6 h-6" /></span>
                        </div>
                        {previewThumb && (
                            <img src={previewThumb} alt="" loading="lazy"
                                className="object-cover"
                                style={{ width: '56px', height: '56px', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }} />
                        )}
                    </div>
                    <div>
                        <p className="section-label" style={{ marginBottom: '0.25rem' }}>Tool 01</p>
                        <h2 className="font-display" style={{ fontSize: 'var(--text-h2)', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.15 }}>
                            {langPack.cat5Title}
                        </h2>
                        <p style={{ marginTop: '0.25rem', color: 'var(--color-ink-soft)', fontSize: 'var(--text-caption)' }}>
                            {langPack.cat5Desc}
                        </p>
                    </div>
                </button>

                {/* Tile B — Social Post */}
                <button
                    onClick={() => onNavigate(View.Social)}
                    className="animate-stagger-2 ios-btn-press luxury-card text-left relative"
                    style={{ gridArea: 'b', padding: '1.1rem', minHeight: '132px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                    aria-label={langPack.cat6Title}
                >
                    <span style={{ color: 'var(--color-accent)' }}><Icon name="social" className="w-6 h-6" /></span>
                    <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>{langPack.cat6Title}</h3>
                </button>

                {/* Tile C — Inbox */}
                <button
                    onClick={() => onNavigate(View.Inbox)}
                    className="animate-stagger-2 ios-btn-press luxury-card text-left relative"
                    style={{ gridArea: 'c', padding: '1.1rem', minHeight: '132px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                    aria-label="Staff Inbox"
                >
                    <div className="flex items-start justify-between">
                        <span style={{ color: 'var(--color-accent)' }}><Icon name="inbox" className="w-6 h-6" /></span>
                        {!!inboxCount && (
                            <span
                                className="flex items-center justify-center"
                                style={{ minWidth: '20px', height: '20px', padding: '0 6px', borderRadius: '9999px', background: 'var(--color-accent)', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}
                            >
                                {inboxCount}
                            </span>
                        )}
                    </div>
                    <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>Staff Inbox</h3>
                </button>

                {/* Tile D — Gallery (wide, thumbnail strip) */}
                <button
                    onClick={() => onNavigate(View.Gallery)}
                    className="animate-stagger-3 ios-btn-press luxury-card text-left relative"
                    style={{ gridArea: 'd', padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                    aria-label="Gallery"
                >
                    <div className="flex-1 min-w-0">
                        <span style={{ color: 'var(--color-accent)' }}><Icon name="gallery" className="w-6 h-6" /></span>
                        <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)', marginTop: '0.4rem' }}>Gallery</h3>
                    </div>
                    {galleryStrip.length > 0 && (
                        <div className="flex -space-x-2 flex-shrink-0">
                            {galleryStrip.map((item, i) => (
                                <img
                                    key={item.fileId ?? i}
                                    src={item.thumbnailUrl}
                                    alt=""
                                    loading="lazy"
                                    className="object-cover"
                                    style={{ width: '40px', height: '40px', borderRadius: '0.6rem', border: '2px solid var(--color-surface)' }}
                                />
                            ))}
                        </div>
                    )}
                </button>
            </div>

            {/* Footer tagline */}
            <p className="animate-stagger-3 text-center" style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-label)', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase' }}>
                Powered by Google Gemini AI
            </p>

        </div>
    );
};

export default MainMenu;

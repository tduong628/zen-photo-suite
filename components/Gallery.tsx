
import React, { useState, useEffect, useCallback } from 'react';
import { LanguagePack } from '../types';
import { GalleryItem, fetchGallery, deleteFromGallery, isGalleryConfigured } from '../services/galleryService';
import Loader from './Loader';
import Icon from './icons';

interface GalleryProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    onCreatePhoto?: () => void;
}

const TOOL_FILTERS = ['All', 'Photo Branding', 'Promotion Graphic', 'Brochure Background'];

const Gallery: React.FC<GalleryProps> = ({ showNotification, onCreatePhoto }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [selected, setSelected] = useState<GalleryItem | null>(null);

    const loadGallery = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchGallery();
        setItems(data);
        setIsLoading(false);
    }, []);

    useEffect(() => { loadGallery(); }, [loadGallery]);

    const handleDelete = async (item: GalleryItem) => {
        setItems(prev => prev.filter(i => i.fileId !== item.fileId));
        setSelected(null);
        await deleteFromGallery(item.fileId);
        showNotification('Removed from gallery.', 'success');
    };

    const handleDownload = (item: GalleryItem) => {
        window.open(`https://drive.google.com/uc?export=download&id=${item.fileId}`, '_blank');
    };

    const filtered = filter === 'All' ? items : items.filter(i => i.tool === filter);

    if (!isGalleryConfigured()) {
        return (
            <div className="luxury-card p-8 text-center stagger-up">
                <p className="section-label mb-2">GALLERY</p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Gallery backend not connected yet. Deploy the Apps Script and set its URL in galleryService.ts.
                </p>
            </div>
        );
    }

    return (
        <div className="stagger-up">
            <p className="section-label mb-1">SAVED CREATIONS</p>
            <h2 className="font-display mb-4" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-ink)' }}>
                Your Gallery
            </h2>

            {/* Filter chips */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {TOOL_FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="ios-btn-press whitespace-nowrap px-3.5 py-1.5 text-xs font-medium"
                        style={{
                            borderRadius: '1rem',
                            background: filter === f ? 'var(--color-primary)' : '#fff',
                            color: filter === f ? '#fff' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-border)',
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="py-16 flex justify-center"><Loader /></div>
            ) : filtered.length === 0 ? (
                <div className="luxury-card p-8 text-center flex flex-col items-center gap-3">
                    <span style={{ color: 'var(--color-accent)', opacity: 0.55 }}>
                        <Icon name="gallery" className="w-14 h-14" />
                    </span>
                    <h3 style={{ fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)' }}>No photos yet</h3>
                    <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-body-sm)', maxWidth: '22rem' }}>
                        Generate something and it will appear here automatically.
                    </p>
                    {onCreatePhoto && (
                        <button onClick={onCreatePhoto} className="btn-primary ios-btn-press mt-1">
                            Create your first photo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map(item => (
                        <button
                            key={item.fileId}
                            onClick={() => setSelected(item)}
                            className="ios-btn-press luxury-card overflow-hidden text-left"
                            style={{ padding: 0 }}
                        >
                            <img
                                src={item.thumbnailUrl}
                                alt={item.style || item.tool}
                                loading="lazy"
                                className="w-full aspect-square object-cover"
                                style={{ background: 'var(--color-surface-sunken)' }}
                            />
                            <div className="p-2.5">
                                <p className="text-[0.65rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                                    {item.tool}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                    {item.style || new Date(item.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Detail modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
                    style={{ background: 'var(--color-scrim)', backdropFilter: 'blur(6px)' }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="luxury-card w-full max-w-md overflow-hidden fade-in"
                        style={{ padding: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img src={selected.thumbnailUrl} alt="" className="w-full object-cover" style={{ maxHeight: '50vh' }} />
                        <div className="p-4">
                            <p className="section-label">{selected.tool}</p>
                            {selected.style && <p className="font-display text-lg mb-1">{selected.style}</p>}
                            {selected.caption && <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{selected.caption}</p>}
                            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                                {new Date(selected.timestamp).toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownload(selected)} className="btn-primary ios-btn-press flex-1">
                                    Download
                                </button>
                                <button
                                    onClick={() => handleDelete(selected)}
                                    className="btn-destructive ios-btn-press"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;

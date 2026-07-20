
import React, { useState, useEffect, useCallback } from 'react';
import { LanguagePack } from '../types';
import {
    StaffUpload, fetchStaffUploads, fetchUploadImage, markUploadStatus,
    isInboxConfigured, getStaffUploadFormUrl,
} from '../services/staffInboxService';
import Loader from './Loader';

interface StaffInboxProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    onBrandImage: (image: { base64: string; mimeType: string }, upload: StaffUpload) => void;
}

const STATUS_FILTERS = ['PENDING', 'PROCESSED', 'ALL'] as const;

const StaffInbox: React.FC<StaffInboxProps> = ({ showNotification, onBrandImage }) => {
    const [uploads, setUploads] = useState<StaffUpload[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<typeof STATUS_FILTERS[number]>('PENDING');
    const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

    const loadInbox = useCallback(async () => {
        setIsLoading(true);
        setUploads(await fetchStaffUploads());
        setIsLoading(false);
    }, []);

    useEffect(() => { loadInbox(); }, [loadInbox]);

    const handleBrand = async (upload: StaffUpload) => {
        setLoadingFileId(upload.fileId);
        const image = await fetchUploadImage(upload.fileId);
        setLoadingFileId(null);
        if (!image) {
            showNotification('Could not load the photo. Try again.');
            return;
        }
        onBrandImage(image, upload);
    };

    const handleSkip = async (upload: StaffUpload) => {
        setUploads(prev => prev.map(u => u.fileId === upload.fileId ? { ...u, status: 'SKIPPED' as const } : u));
        await markUploadStatus(upload.fileId, 'SKIPPED');
    };

    // This is the ZEN app — only show Zen salon uploads (shared upload backend).
    const salonUploads = uploads.filter(u => (u.salon || '').includes('Zen'));
    const filtered = salonUploads.filter(u =>
        filter === 'ALL' ? true : filter === 'PENDING' ? u.status === 'PENDING' : u.status === 'PROCESSED');
    const pendingCount = salonUploads.filter(u => u.status === 'PENDING').length;

    if (!isInboxConfigured()) {
        return (
            <div className="luxury-card p-8 text-center stagger-up">
                <p className="section-label mb-2">STAFF INBOX</p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Staff upload backend not connected yet. Deploy apps-script/StaffUploads.gs and set its URL in staffInboxService.ts.
                </p>
            </div>
        );
    }

    return (
        <div className="stagger-up">
            <p className="section-label mb-1">FROM YOUR TEAM</p>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-ink)' }}>
                    Staff Inbox
                    {pendingCount > 0 && (
                        <span className="ml-2 align-middle text-xs font-sans font-bold text-white px-2 py-1 rounded-full"
                            style={{ background: 'var(--color-primary)' }}>
                            {pendingCount} new
                        </span>
                    )}
                </h2>
                <button onClick={loadInbox} className="ios-btn-press text-xs font-semibold px-3 py-2"
                    style={{ borderRadius: '1rem', border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text-muted)' }}>
                    🔄 Refresh
                </button>
            </div>

            {/* Share link for staff */}
            <button
                onClick={() => {
                    navigator.clipboard?.writeText(getStaffUploadFormUrl());
                    showNotification('Staff upload link copied — text it to your team!', 'success');
                }}
                className="ios-btn-press w-full mb-5 p-3 text-sm font-medium text-left flex items-center justify-between"
                style={{ borderRadius: '1rem', background: 'var(--color-accent-tint)', border: '1px dashed var(--color-border-strong)', color: 'var(--color-accent-dark)' }}>
                <span>📲 Copy the upload link to share with staff</span>
                <span>→</span>
            </button>

            {/* Status filter */}
            <div className="flex gap-2 mb-5">
                {STATUS_FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className="ios-btn-press px-3.5 py-1.5 text-xs font-medium"
                        style={{
                            borderRadius: '1rem',
                            background: filter === f ? 'var(--color-primary)' : '#fff',
                            color: filter === f ? '#fff' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-border)',
                        }}>
                        {f === 'PENDING' ? 'New' : f === 'PROCESSED' ? 'Done' : 'All'}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="py-16 flex justify-center"><Loader /></div>
            ) : filtered.length === 0 ? (
                <div className="luxury-card p-8 text-center">
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {filter === 'PENDING'
                            ? 'No new photos from staff. Share the upload link above with your team!'
                            : 'Nothing here yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(u => (
                        <div key={u.fileId} className="luxury-card flex gap-3 p-3 items-center">
                            <img src={u.thumbnailUrl} alt={u.serviceType} loading="lazy"
                                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                style={{ background: 'var(--color-surface-sunken)' }} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                                        {u.staffName || 'Staff'}
                                    </span>
                                    <span className="text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 rounded"
                                        style={{
                                            background: u.status === 'PENDING' ? '#FBEBD2' : u.status === 'PROCESSED' ? 'var(--color-success-tint)' : 'var(--color-surface-sunken)',
                                            color: u.status === 'PENDING' ? 'var(--color-accent-dark)' : u.status === 'PROCESSED' ? 'var(--color-success)' : 'var(--color-ink-soft)',
                                        }}>
                                        {u.status === 'PENDING' ? 'New' : u.status === 'PROCESSED' ? 'Done' : 'Skipped'}
                                    </span>
                                </div>
                                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                    {u.serviceType} · {u.salon.includes('Zen') ? 'Zen' : 'Deluxe'} · {new Date(u.timestamp).toLocaleDateString()}
                                </p>
                                {u.note && <p className="text-xs truncate italic" style={{ color: 'var(--color-text-muted)' }}>"{u.note}"</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <button onClick={() => handleBrand(u)} disabled={loadingFileId === u.fileId}
                                    className="btn-primary ios-btn-press text-xs px-3 py-2 disabled:opacity-50">
                                    {loadingFileId === u.fileId ? 'Loading…' : '✨ Brand it'}
                                </button>
                                {u.status === 'PENDING' && (
                                    <button onClick={() => handleSkip(u)}
                                        className="ios-btn-press text-xs px-3 py-1.5"
                                        style={{ borderRadius: '0.8rem', border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text-muted)' }}>
                                        Skip
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StaffInbox;

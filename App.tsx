
import React, { useState, useCallback } from 'react';
import { protocolData, Language } from './constants';
import { View, NotificationType } from './types';
import Header from './components/Header';
import MainMenu from './components/MainMenu';
import BrandingTool from './components/BrandingTool';
import SocialPostTool from './components/SocialPostTool';
import Gallery from './components/Gallery';
import StaffInbox from './components/StaffInbox';
import { markUploadStatus } from './services/staffInboxService';
import Notification from './components/Notification';
import Icon from './components/icons';

const App: React.FC = () => {
    const [currentLang, setCurrentLang] = useState<Language>('EN');
    const [currentView, setCurrentView] = useState<View>(View.MainMenu);
    const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
    const [inboxImage, setInboxImage] = useState<{ base64: string; mimeType: string } | null>(null);

    const showNotification = useCallback((message: string, type: NotificationType = 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    const navigateTo = (view: View) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentView(view);
    };

    const goHome = () => {
        navigateTo(View.MainMenu);
    };
    
    const renderView = () => {
        const langPack = protocolData[currentLang];
        
        switch (currentView) {
            case View.Branding:
                return <BrandingTool langPack={langPack} showNotification={showNotification}
                    initialImage={inboxImage} onInitialImageConsumed={() => setInboxImage(null)} />;
            case View.Inbox:
                return <StaffInbox langPack={langPack} showNotification={showNotification}
                    onBrandImage={(image, upload) => {
                        setInboxImage(image);
                        markUploadStatus(upload.fileId, 'PROCESSED');
                        navigateTo(View.Branding);
                    }} />;
            case View.Social:
                return <SocialPostTool langPack={langPack} showNotification={showNotification} />;
            case View.Gallery:
                return <Gallery langPack={langPack} showNotification={showNotification} />;
            case View.MainMenu:
            default:
                return <MainMenu langPack={langPack} onNavigate={navigateTo} />;
        }
    };
    
    // Bottom Navigation Logic
    const navItems = [
        { id: 'home', view: View.MainMenu, icon: 'home', label: 'Home' },
        { id: 'branding', view: View.Branding, icon: 'branding', label: 'Photo' },
        { id: 'social', view: View.Social, icon: 'social', label: 'Social' },
        { id: 'inbox', view: View.Inbox, icon: 'inbox', label: 'Inbox' },
        { id: 'gallery', view: View.Gallery, icon: 'gallery', label: 'Gallery' },
    ];

    return (
        <div className="min-h-screen pb-32 relative" style={{ backgroundColor: 'var(--color-bg)' }}>
            {/* Ambient luxury orbs */}
            <div className="orb w-[55vw] h-[55vw] max-w-[480px] max-h-[480px]"
                style={{ top: '-8%', left: '-12%', background: 'rgba(249,168,212,0.28)' }} />
            <div className="orb w-[45vw] h-[45vw] max-w-[400px] max-h-[400px]"
                style={{ bottom: '-8%', right: '-10%', background: 'rgba(196,181,253,0.22)' }} />
            <div className="orb w-[30vw] h-[30vw] max-w-[260px] max-h-[260px]"
                style={{ top: '40%', right: '5%', background: 'rgba(253,186,116,0.12)' }} />

            <Header currentLang={currentLang} onSetLang={setCurrentLang} onGoHome={goHome} />

            <main className="relative z-10 px-4 sm:px-6 max-w-2xl mx-auto pt-6">
                <div key={currentView} className="animate-ios-home">
                    {renderView()}
                </div>
            </main>

            {/* Luxury Floating Bottom Nav */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
                <nav
                    className="glass-panel pointer-events-auto flex items-center gap-1 p-1.5"
                    style={{
                        borderRadius: '2rem',
                        boxShadow: 'var(--shadow-nav)',
                        border: '1px solid rgba(255,255,255,0.7)',
                    }}
                >
                    {navItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigateTo(item.view as View)}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                className="ios-btn-press relative flex flex-col items-center justify-center gap-0.5 transition-all"
                                style={{
                                    width: isActive ? '5.5rem' : '3.5rem',
                                    height: '3.25rem',
                                    borderRadius: '1.5rem',
                                    background: isActive ? 'var(--color-primary)' : 'transparent',
                                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                                    transition: 'all 280ms cubic-bezier(0.16,1,0.3,1)',
                                }}
                            >
                                <div style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)' }}>
                                    <Icon name={item.icon} className="w-5 h-5" />
                                </div>
                                <span
                                    className="font-medium leading-none"
                                    style={{
                                        fontSize: '0.6rem',
                                        letterSpacing: '0.04em',
                                        opacity: isActive ? 1 : 0,
                                        maxHeight: isActive ? '12px' : '0px',
                                        overflow: 'hidden',
                                        transition: 'opacity 200ms ease, max-height 200ms ease',
                                    }}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </div>
    );
};

export default App;

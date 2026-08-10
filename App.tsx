
import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import Splash from './components/Splash';

const SPLASH_DURATION_MS = 700;

const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const App: React.FC = () => {
    const [currentLang, setCurrentLang] = useState<Language>('EN');
    const [currentView, setCurrentView] = useState<View>(View.MainMenu);
    const [notification, setNotification] = useState<{ id: number; message: string; type: NotificationType } | null>(null);
    const notificationIdRef = useRef(0);
    const [inboxImage, setInboxImage] = useState<{ base64: string; mimeType: string } | null>(null);
    // Reduced-motion users never see the splash at all rather than a single
    // un-animated frame of it (a partial fix isn't full compliance).
    const [showSplash, setShowSplash] = useState(() => !prefersReducedMotion());
    const mainRef = useRef<HTMLElement>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!showSplash) return;
        const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
        return () => clearTimeout(timer);
    }, [showSplash]);

    // Move focus to the new view on every navigation (not on initial mount)
    // so keyboard/screen-reader users get a clear landing point after using
    // the back chevron, instead of losing focus to <body>.
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        mainRef.current?.focus();
    }, [currentView]);

    // id forces a fresh Notification mount on every call (via the `key` prop
    // below) even when message+type are byte-identical to the previous call
    // — e.g. two consecutive branding-overlay failures both surface the same
    // generic errorApiGeneric string. Without a remount, React reuses the
    // existing instance and its [message, type] effect dependency array sees
    // no change, so the display timer never restarts and a second failure
    // arriving while the first toast is still visible can silently fail to
    // extend or re-show it.
    const showNotification = useCallback((message: string, type: NotificationType = 'error') => {
        notificationIdRef.current += 1;
        setNotification({ id: notificationIdRef.current, message, type });
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
                return <Gallery langPack={langPack} showNotification={showNotification} onCreatePhoto={() => navigateTo(View.Branding)} />;
            case View.MainMenu:
            default:
                return <MainMenu langPack={langPack} onNavigate={navigateTo} />;
        }
    };

    return (
        <div className="min-h-screen relative" style={{ backgroundColor: 'var(--color-bg)' }}>
            {showSplash && <Splash />}

            <Header currentLang={currentLang} onSetLang={setCurrentLang} onGoHome={goHome} currentView={currentView} />

            <main
                ref={mainRef}
                tabIndex={-1}
                className="relative z-10 px-4 sm:px-6 max-w-2xl mx-auto pt-6 pb-16"
            >
                <div key={currentView} className="animate-ios-home">
                    {renderView()}
                </div>
            </main>

            {notification && <Notification key={notification.id} message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        </div>
    );
};

export default App;

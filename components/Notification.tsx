
import React, { useEffect, useRef, useState } from 'react';
import { NotificationType } from '../types';
import Icon, { IconName } from './icons';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
}

const VARIANTS: Record<NotificationType, { bg: string; bar: string; icon: IconName }> = {
    success: { bg: 'var(--color-success-tint)', bar: 'var(--color-success)', icon: 'checkCircle' },
    error:   { bg: 'var(--color-error-tint)',   bar: 'var(--color-error)',   icon: 'alertCircle' },
};

const DISPLAY_MS = 3200;
const EXIT_MS = 180;
const REDUCED_EXIT_MS = 120;

/**
 * Owns its full show -> exit-animation -> close lifecycle so the parent
 * never unmounts this mid-transition (that race previously cut the exit
 * animation short — see incident notes in code review).
 */
const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    const [show, setShow] = useState(false);
    const prefersReducedMotion = useRef(
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ).current;
    const exitMs = prefersReducedMotion ? REDUCED_EXIT_MS : EXIT_MS;

    useEffect(() => {
        setShow(true);
        const displayTimer = setTimeout(() => setShow(false), DISPLAY_MS);
        return () => clearTimeout(displayTimer);
    }, [message, type]);

    useEffect(() => {
        if (show) return;
        const closeTimer = setTimeout(onClose, exitMs);
        return () => clearTimeout(closeTimer);
    }, [show, onClose, exitMs]);

    const dismiss = () => setShow(false);

    const variant = VARIANTS[type] ?? VARIANTS.error;
    const translateY = prefersReducedMotion ? '0' : (show ? '0' : '12px');

    return (
        <div
            role="status"
            aria-live="polite"
            onClick={dismiss}
            className="fixed left-1/2 z-[90] cursor-pointer"
            style={{
                bottom: `calc(16px + env(safe-area-inset-bottom))`,
                transform: `translateX(-50%) translateY(${translateY})`,
                opacity: show ? 1 : 0,
                transition: `transform ${exitMs}ms var(--ease-standard), opacity ${exitMs}ms var(--ease-standard)`,
                maxWidth: 'calc(100vw - 32px)',
            }}
        >
            <div
                className="flex items-center gap-2.5 pl-3 pr-4"
                style={{
                    background: variant.bg,
                    borderLeft: `3px solid ${variant.bar}`,
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-toast)',
                    minHeight: '44px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                }}
            >
                <span style={{ color: variant.bar, flexShrink: 0 }}>
                    <Icon name={variant.icon} className="w-5 h-5" />
                </span>
                <p style={{ color: 'var(--color-ink)', fontSize: 'var(--text-body-sm)', fontWeight: 500 }}>
                    {message}
                </p>
            </div>
        </div>
    );
};

export default Notification;

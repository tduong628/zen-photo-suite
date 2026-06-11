
import React, { useEffect, useState } from 'react';
import { NotificationType } from '../types';

interface NotificationProps {
    message: string;
    type: NotificationType;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
        const timer = setTimeout(() => {
            setShow(false);
        }, 2700);
        return () => clearTimeout(timer);
    }, [message, type]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`fixed top-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 ease-in-out ${show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${bgColor}`}>
            <p>{message}</p>
        </div>
    );
};

export default Notification;

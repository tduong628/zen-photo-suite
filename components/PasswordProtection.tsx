import React, { useState } from 'react';
import { LanguagePack } from '../types';

interface PasswordProtectionProps {
    onLoginSuccess: () => void;
    langPack: LanguagePack;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ onLoginSuccess, langPack }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const correctPassword = 'Deluxe@0808';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === correctPassword) {
            onLoginSuccess();
        } else {
            setError(langPack.passwordError);
            setPassword('');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-xs text-center">
                <h2 className="text-2xl font-bold text-gray-800">{langPack.passwordTitle}</h2>
                <p className="text-gray-600 mt-2">{langPack.passwordPrompt}</p>
            
                <form onSubmit={handleSubmit} className="mt-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password-input" className="sr-only">
                                {langPack.passwordPlaceholder}
                            </label>
                            <input
                                id="password-input"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="mt-1 block w-full text-center rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                placeholder={langPack.passwordPlaceholder}
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            className="w-full px-6 py-2 text-white font-semibold bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {langPack.passwordSubmit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordProtection;
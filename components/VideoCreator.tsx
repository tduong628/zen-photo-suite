
import React, { useState, useEffect } from 'react';
import { LanguagePack } from '../types';
import { generateVideoService } from '../services/geminiService';
import Loader from './Loader';
import Icon from './icons';

interface VideoCreatorProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
}

const VideoCreator: React.FC<VideoCreatorProps> = ({ langPack, showNotification }) => {
    const [image, setImage] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('zoom');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');

    const motionStyles = [
        { id: 'zoom', key: 'motionStyleZoom', prompt: 'Animate this image with a subtle, slow zoom-in effect.' },
        { id: 'pan', key: 'motionStylePan', prompt: 'Animate this image with a gentle, slow horizontal pan from left to right.' },
        { id: 'sparkle', key: 'motionStyleSparkle', prompt: 'Animate this image with a magical sparkle effect, with subtle shimmering lights appearing and disappearing.' },
        { id: 'petals', key: 'motionStylePetals', prompt: 'Animate this image with delicate, soft-focus flower petals gently floating across the screen.' },
    ];
    
    const videoFormats = [
        { id: '16:9', key: 'videoToolFormatRegular' },
        { id: '1:1', key: 'videoToolFormatSquare' },
        { id: '9:16', key: 'videoToolFormatReel' },
    ];

    const loadingMessages = [
        "Initializing AI model...",
        "Analyzing image composition...",
        "Applying motion effects...",
        "Rendering video frames...",
        "This can take a few minutes...",
        "Finalizing video output...",
        "Almost there..."
    ];

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Convert to standard JPEG to handle AVIF/WebP
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    const base64 = dataUrl.split(',')[1];
                    setImage({ url: dataUrl, base64, mimeType: 'image/jpeg' });
                    setVideoUrl(null);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };
    
    const handleGenerateVideo = async () => {
        if (!image) {
            showNotification("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        const messageInterval = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 5000);

        const style = motionStyles.find(s => s.id === selectedStyle);
        const basePrompt = style ? style.prompt : motionStyles[0].prompt;
        const prompt = `${basePrompt} Add the text "Zen Nail Spa" in an elegant, white font at the bottom of the video.`;

        try {
            const resultUrl = await generateVideoService(prompt, image.base64, image.mimeType, aspectRatio);
            if (resultUrl) {
                setVideoUrl(resultUrl);
            } else {
                showNotification(langPack.errorApiGeneric, 'error');
            }
        } catch (error: any) {
            console.error(error);
            const message = error.toString().includes('429') 
                ? langPack.errorApiRateLimit 
                : langPack.errorApiGeneric;
            showNotification(message, 'error');
        } finally {
            clearInterval(messageInterval);
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    return (
        <div>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">{langPack.videoToolTitle}</h2>
                <p className="text-gray-600 mt-2">{langPack.videoToolDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-4">
                    <label className="cursor-pointer flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-gray-400 focus:outline-none">
                        <span className="flex items-center space-x-2">
                            <Icon name="upload" className="w-6 h-6 text-gray-600" />
                            <span className="font-medium text-gray-600">{langPack.brandToolUpload}</span>
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>

                    {image && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{langPack.videoToolStyleLabel}</label>
                                <select 
                                    value={selectedStyle}
                                    onChange={e => setSelectedStyle(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring focus:ring-cyan-200 focus:ring-opacity-50"
                                >
                                    {motionStyles.map(s => <option key={s.id} value={s.id}>{langPack[s.key]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{langPack.videoToolFormatLabel}</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {videoFormats.map(format => (
                                        <button key={format.id} onClick={() => setAspectRatio(format.id)} className={`px-3 py-1 text-sm rounded-full border transition-colors duration-200 ${aspectRatio === format.id ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                            {langPack[format.key]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={handleGenerateVideo}
                                disabled={isLoading} 
                                className="w-full px-6 py-3 text-white font-semibold bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-700 disabled:bg-cyan-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Generating Video...' : langPack.videoToolGenerateBtn}
                            </button>
                        </div>
                    )}
                </div>
                <div>
                    <div className="h-full flex flex-col">
                        <label className="block text-sm font-medium text-gray-700">{langPack.videoToolResultTitle}</label>
                        <div className="relative flex-1 mt-1 border rounded-lg overflow-hidden flex items-center justify-center min-h-[250px] bg-gray-50 aspect-square">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                    <Loader />
                                    <p className="mt-4 text-cyan-700 font-semibold">{loadingMessage}</p>
                                    <p className="mt-2 text-sm text-gray-500">Video generation can take several minutes. Please be patient.</p>
                                </div>
                            )}
                            {!isLoading && videoUrl && (
                                <video src={videoUrl} controls autoPlay loop muted className="w-full h-full object-contain" />
                            )}
                             {!isLoading && !videoUrl && image && (
                                <img src={image.url} className="w-full h-auto object-contain" alt="preview" />
                            )}
                        </div>
                         {videoUrl && !isLoading && (
                            <div className="mt-2 text-center">
                                <a 
                                    href={videoUrl} 
                                    download="generated-video.mp4" 
                                    className="inline-block w-full px-6 py-2.5 text-white font-semibold bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                                >
                                    {langPack.videoToolDownloadBtn}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCreator;

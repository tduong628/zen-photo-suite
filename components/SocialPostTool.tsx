
import React, { useState, useRef } from 'react';
import { LanguagePack, ImageAnalysis, OmniSocialResult } from '../types';
import { analyzeSocialImage, generateOmniSocialContent } from '../services/geminiService';
import Loader from './Loader';
import Icon from './icons';

interface SocialPostToolProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
}

type Tone = 'professional' | 'friendly' | 'playful' | 'empathetic' | 'urgent' | 'informative';
type Platform = 'instagram' | 'facebook' | 'tiktok';

const SocialPostTool: React.FC<SocialPostToolProps> = ({ langPack, showNotification }) => {
    // State
    const [image, setImage] = useState<{url: string, base64: string, mimeType: string} | null>(null);
    const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
    const [content, setContent] = useState<OmniSocialResult | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState<Platform>('instagram');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userNotes, setUserNotes] = useState('');
    const [tone, setTone] = useState<Tone>('friendly');
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Convert to standard JPEG to handle AVIF/WebP/etc.
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
                    setAnalysis(null);
                    setContent(null);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeSocialImage(image.base64, image.mimeType);
            if (result) {
                const parsed = JSON.parse(result);
                setAnalysis(parsed);
            }
        } catch (error) {
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!analysis || !image) return;
        setIsGenerating(true);
        try {
            const result = await generateOmniSocialContent(analysis, tone, userNotes);
            if (result) {
                const parsed = JSON.parse(result);
                setContent(parsed);
            }
        } catch (error) {
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    };
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const tones: { id: Tone, key: keyof LanguagePack }[] = [
        { id: 'professional', key: 'socialToolToneProfessional' },
        { id: 'friendly', key: 'socialToolToneFriendly' },
        { id: 'playful', key: 'socialToolTonePlayful' },
        { id: 'empathetic', key: 'socialToolToneEmpathetic' },
        { id: 'urgent', key: 'socialToolToneUrgent' },
        { id: 'informative', key: 'socialToolToneInformative' },
    ];

    return (
        <div className="space-y-6 pb-20">
             <div className="text-left px-2 mb-4">
                <h2 className="font-display" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-ink)' }}>{langPack.socialToolTitle}</h2>
                <p style={{ color: 'var(--color-ink-soft)', marginTop: '0.25rem' }}>{langPack.socialToolDesc}</p>
            </div>

            {/* STEP 1: Upload & Visualize */}
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-white/50 relative overflow-hidden">
                {!image ? (
                     <label className="flex flex-col items-center justify-center w-full h-64 rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group ios-btn-press">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                             <Icon name="upload" className="w-8 h-8 text-indigo-500" />
                        </div>
                        <span className="mt-4 font-semibold text-gray-600">{langPack.socialToolUpload}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                ) : (
                    <div className="relative w-full">
                         <div className="aspect-[4/5] sm:aspect-video w-full rounded-[1.5rem] overflow-hidden bg-gray-100 relative">
                             <img src={image.url} className="w-full h-full object-cover" alt="Preview" />
                             
                             {/* AI Scan Overlay */}
                             {isAnalyzing && (
                                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                     <div className="w-20 h-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
                                     <p className="text-white font-bold tracking-wider animate-pulse">{langPack.socialToolAnalyzing}</p>
                                 </div>
                             )}

                             {/* Action Overlay */}
                             {!analysis && !isAnalyzing && (
                                 <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                                     <button 
                                        onClick={handleAnalyze}
                                        className="bg-white/90 backdrop-blur-md text-indigo-900 px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 ios-btn-press hover:bg-white"
                                     >
                                         <span className="text-xl">✨</span> {langPack.socialToolAnalyzeBtn}
                                     </button>
                                 </div>
                             )}
                             
                             <button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors">
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                         </div>
                    </div>
                )}
            </div>

            {/* STEP 2: Analysis Result (Smart Vision) */}
            {analysis && (
                <div className="animate-fade-in space-y-4">
                     {/* Analysis Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Detected Service</p>
                            <p className="text-lg font-bold text-indigo-900 leading-tight mt-1">{analysis.serviceType}</p>
                        </div>
                        <div className="p-4 rounded-2xl border" style={{ background: 'var(--color-accent-tint)', borderColor: 'var(--color-border)' }}>
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>Mood</p>
                            <p className="text-lg font-bold leading-tight mt-1" style={{ color: 'var(--color-accent-dark)' }}>{analysis.mood}</p>
                        </div>
                    </div>

                    {/* Inputs for Generation */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <div className="mb-2 px-1 text-xs font-bold text-gray-500 uppercase tracking-wide">Select Tone</div>
                        
                        {/* Scrollable Tone Selector */}
                        <div className="relative group mb-4">
                            <button 
                                onClick={() => scroll('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </button>
                            
                            <div 
                                ref={scrollContainerRef}
                                className="flex gap-2 overflow-x-auto no-scrollbar py-2 scroll-smooth"
                            >
                                {tones.map(t => (
                                    <button key={t.id} onClick={() => setTone(t.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ios-btn-press ${tone === t.id ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                                        {langPack[t.key] as string}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => scroll('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1-0 1.414 0z" clipRule="evenodd" /></svg>
                            </button>
                        </div>

                        <input 
                            type="text" 
                            placeholder={langPack.socialToolQ1}
                            value={userNotes} 
                            onChange={e => setUserNotes(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-indigo-500 mb-4"
                        />
                         <button 
                            onClick={handleGenerate} 
                            disabled={isGenerating} 
                            className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg ios-btn-press disabled:opacity-70 flex justify-center items-center gap-2"
                            style={{ background: 'var(--color-accent)' }}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {langPack.socialToolGenerating}
                                </>
                            ) : (
                                <>
                                    {langPack.socialToolGenerateBtn}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Omni-Channel Result */}
            {content && !isGenerating && (
                <div className="animate-fade-in space-y-6">
                    
                    {/* Feature 5: Engagement Score */}
                    <div className="rounded-3xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-end relative z-10">
                            <div>
                                <p className="text-white/80 font-medium text-sm mb-1">{langPack.socialSectionScore}</p>
                                <div className="text-5xl font-extrabold tracking-tight">{content.viralityScore}<span className="text-2xl opacity-60">/100</span></div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 max-w-[60%]">
                                <p className="text-xs font-medium leading-relaxed">💡 {content.improvementTip}</p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Viral Hooks */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                             <span className="text-lg">🪝</span> {langPack.socialSectionHooks}
                        </h3>
                        <div className="space-y-3">
                            {content.hooks.map((hook, idx) => (
                                <button key={idx} onClick={() => copyToClipboard(hook)} className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-800 border border-transparent hover:border-gray-200">
                                    "{hook}"
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature: Engagement Comments */}
                    {content.comments && content.comments.length > 0 && (
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <span className="text-lg">💬</span> {langPack.socialSectionComments}
                             </h3>
                             <div className="space-y-3">
                                {content.comments.map((comment, idx) => (
                                    <button key={idx} onClick={() => copyToClipboard(comment)} className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-800 border border-transparent hover:border-gray-200">
                                        "{comment}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platform Content Tabs */}
                    <div>
                        <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-4">
                            {(['instagram', 'facebook', 'tiktok'] as Platform[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setActiveTab(p)}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === p ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
                                >
                                    {p === 'instagram' ? langPack.socialTabInsta : p === 'facebook' ? langPack.socialTabFB : langPack.socialTabTikTok}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 min-h-[300px]">
                            {activeTab === 'instagram' && (
                                <div className="space-y-4">
                                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-medium">
                                        {content.instagram}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">{langPack.socialSectionHashtags}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {content.hashtags.niche.map((tag, i) => <span key={`n-${i}`} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">#{tag}</span>)}
                                            {content.hashtags.local.map((tag, i) => <span key={`l-${i}`} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">#{tag}</span>)}
                                            {content.hashtags.trending.map((tag, i) => <span key={`t-${i}`} className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md">#{tag}</span>)}
                                        </div>
                                    </div>
                                    <button onClick={() => copyToClipboard(`${content.instagram}\n\n${Object.values(content.hashtags).flat().map(t => `#${t}`).join(' ')}`)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold mt-4 ios-btn-press">
                                        {langPack.socialToolCopyBtn}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'facebook' && (
                                <div className="space-y-4">
                                     <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-medium">
                                        {content.facebook}
                                    </div>
                                     <button onClick={() => copyToClipboard(content.facebook)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4 ios-btn-press">
                                        {langPack.socialToolCopyBtn}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'tiktok' && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                         <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Gemini Veo 3.1 Video Prompts</h3>
                                         <p className="text-xs text-gray-400 mb-2">Copy these prompts to generate background video.</p>
                                         
                                         {content.veoPrompts && (
                                            <>
                                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-indigo-800">Cinematic</span>
                                                        <button onClick={() => copyToClipboard(content.veoPrompts.cinematic)} className="text-xs text-indigo-600 font-bold hover:underline">Copy</button>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-snug">{content.veoPrompts.cinematic}</p>
                                                </div>

                                                <div className="p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-fuchsia-800">Motion</span>
                                                        <button onClick={() => copyToClipboard(content.veoPrompts.motion)} className="text-xs text-fuchsia-600 font-bold hover:underline">Copy</button>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-snug">{content.veoPrompts.motion}</p>
                                                </div>

                                                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-cyan-800">Creative</span>
                                                        <button onClick={() => copyToClipboard(content.veoPrompts.creative)} className="text-xs text-cyan-600 font-bold hover:underline">Copy</button>
                                                    </div>
                                                    <p className="text-sm text-gray-700 leading-snug">{content.veoPrompts.creative}</p>
                                                </div>
                                            </>
                                         )}
                                    </div>

                                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                         <p className="text-xs font-bold text-gray-400 uppercase mb-2">Script & Direction</p>
                                         <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap font-mono text-xs">
                                            {content.tiktokScript}
                                        </div>
                                    </div>
                                     <button onClick={() => copyToClipboard(content.tiktokScript)} className="w-full py-3 bg-black text-white rounded-xl font-bold mt-4 ios-btn-press">
                                        Copy Script
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default SocialPostTool;

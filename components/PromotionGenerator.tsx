
import React, { useState, useEffect } from 'react';
import { LanguagePack } from '../types';
import { generatePromoCaptionService, generatePromoGraphicService } from '../services/geminiService';
import { saveToGallery } from '../services/galleryService';
import { injectS24UltraMetadata } from '../services/exifService';
import Loader from './Loader';
import Icon from './icons';

interface PromotionGeneratorProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    initialData?: {title: string, offer: string, offer2?: string} | null;
}

const PromotionGenerator: React.FC<PromotionGeneratorProps> = ({ langPack, showNotification, initialData }) => {
    const [title, setTitle] = useState('');
    const [offer, setOffer] = useState('');
    const [offer2, setOffer2] = useState('');
    const [notes, setNotes] = useState('');
    const [dates, setDates] = useState('');
    const [keywords, setKeywords] = useState('');
    const [style, setStyle] = useState('elegant');
    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isLoadingCaption, setIsLoadingCaption] = useState(false);

    useEffect(() => {
        if(initialData){
            setTitle(initialData.title);
            setOffer(initialData.offer);
            setOffer2(initialData.offer2 || '');
        }
    }, [initialData]);

    const styles = [
        { id: 'elegant', key: 'promoStyleElegant' },
        { id: 'modern-luxury', key: 'promoStyleModern' },
        { id: 'seasonal', key: 'promoStyleSeasonal' },
        { id: 'playful', key: 'promoStylePlayful' },
        { id: 'lifestyle', key: 'promoStyleLifestyle' },
        { id: 'natural', key: 'promoStyleNatural' },
        { id: 'split-screen', key: 'promoStyleSplit' },
    ];

    const getPromoPrompt = () => {
        const salonName = "Zen Nail Spa";
        const salonPhone = "(919) 316-7856";
        const salonAddress = "105 NC-54 Hwy, Ste 277A, Durham, NC 27713";
        
        const basePrompt = `
        - NO TEXT AT THE TOP OF THE IMAGE. NO HEADERS.
        - Promotions and offers must be placed in the center or lower portion.
        - Title: "${title}".
        - Offer: "${offer}".
        ${offer2 ? `- Offer 2: "${offer2}".` : ''}
        ${notes ? `- Note: "${notes}".` : ''}
        - INTEGRATED BRANDING OVERLAY (STRICT): 
          - Centered at the very bottom: "${salonName}" in elegant GOLD script calligraphy.
          - Directly below: "${salonPhone}" and "${salonAddress}" in professional white text.
          - USE a soft dark-to-transparent gradient fade behind the text to ensure it pops and is readable.
          - The branding should look like a luxury salon watermark integrated into the photo.
        - ALL TEXT MUST BE OVERLAY ONLY. TOP 50% OF FRAME MUST BE EMPTY OF TEXT.`;

        let prompt = '';
        switch (style) {
            case 'elegant': prompt = `Elegant high-end background.` + basePrompt; break;
            case 'modern-luxury': prompt = `Modern minimal luxury.` + basePrompt; break;
            case 'seasonal': prompt = `Cozy seasonal autumn theme.` + basePrompt; break;
            case 'playful': prompt = `Fun pastel theme.` + basePrompt; break;
            case 'lifestyle': prompt = `High-end lifestyle magazine style.` + basePrompt; break;
            case 'natural': prompt = `Earth tones and wood textures.` + basePrompt; break;
            case 'split-screen': prompt = `Split screen manicure photo + color block.` + basePrompt; break;
        }
        return prompt;
    };

    const downloadCleanedPromo = (dataUrl: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                
                // Inject Hardware Metadata
                const base64 = canvas.toDataURL('image/jpeg', 0.98);
                const metadataInjectedBase64 = injectS24UltraMetadata(base64);

                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const fileName = `SAMSUNG_S24_ULTRA_PROMO_${dateStr}.jpg`;
                
                const link = document.createElement('a');
                link.href = metadataInjectedBase64;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Hardware-signed promotion downloaded!', 'success');
            }
        };
        img.src = dataUrl;
    };

    const handleGenerateGraphic = async () => {
        if (!title || !offer) {
            showNotification('Please fill in the Title and Offer.');
            return;
        }
        setIsLoadingImage(true);
        setImage(null);
        setCaption('');
        
        try {
            const prompt = getPromoPrompt();
            const result = await generatePromoGraphicService(prompt, "2K");
            if (result) {
                setImage(`data:image/png;base64,${result}`);
                saveToGallery({
                    tool: 'Promotion Graphic',
                    style: title,
                    prompt,
                    caption: offer,
                    imageBase64: result,
                });
            }
            else showNotification(langPack.errorApiGeneric);
        } catch (error: any) {
            console.error(error);
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsLoadingImage(false);
        }
    };

    const handleGenerateCaption = async () => {
        setIsLoadingCaption(true);
        setCaption('');

        let prompt = `Write a compulsion SEO-friendly caption for "Zen Nail Spa" located in Durham NC. 
        Title: ${title}
        Offer: ${offer}
        Tone: Local, friendly, salon-expert. No emojis.`;

        try {
            const result = await generatePromoCaptionService(prompt);
            if (result) setCaption(result);
            else showNotification(langPack.errorApiGeneric);
        } catch (error: any) {
            console.error(error);
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsLoadingCaption(false);
        }
    }

    const copyCaption = () => {
        navigator.clipboard.writeText(caption);
        showNotification('Caption copied!', 'success');
    }

    return (
        <div>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">{langPack.promoToolTitle}</h2>
                <p className="text-gray-600 mt-2">{langPack.promoToolDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Offer</label>
                        <input type="text" value={offer} onChange={e => setOffer(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Style</label>
                        <select value={style} onChange={e => setStyle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50">
                           {styles.map(s => <option key={s.id} value={s.id}>{langPack[s.key]}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerateGraphic} disabled={isLoadingImage} className="w-full px-6 py-3 text-white font-semibold bg-amber-600 rounded-lg shadow-md hover:bg-amber-700 disabled:bg-amber-300 transition-colors">
                        Generate High-Res Graphic
                    </button>
                </div>
                <div>
                    <div className="h-full flex flex-col">
                        <div className="relative flex-1 mt-1 border rounded-lg overflow-hidden flex items-center justify-center min-h-[250px] bg-gray-50 aspect-square">
                           {isLoadingImage && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                                    <Loader />
                                    <p className="mt-4 text-xs font-bold text-amber-600 animate-pulse uppercase">Rendering 2K...</p>
                                </div>
                           )}
                           {image && !isLoadingImage && <img src={image} alt="Promotion" className="w-full h-auto object-contain" />}
                        </div>
                        {image && !isLoadingImage && (
                            <div className="mt-4 space-y-2">
                                <button 
                                    onClick={() => downloadCleanedPromo(image)}
                                    className="w-full px-6 py-2.5 text-white font-semibold bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Download High-Res Graphic
                                </button>
                                <button onClick={handleGenerateCaption} disabled={isLoadingCaption} className="w-full px-6 py-3 text-white font-semibold bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors">
                                    Generate Strategy Caption
                                </button>
                                {caption && (
                                    <div className="p-4 bg-white border rounded-lg">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{caption}</p>
                                        <button onClick={copyCaption} className="mt-2 text-xs text-indigo-600 font-bold uppercase tracking-wider">Copy Caption</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionGenerator;

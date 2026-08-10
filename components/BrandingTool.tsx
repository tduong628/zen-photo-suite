
import React, { useState, useRef, useEffect } from 'react';
import { LanguagePack } from '../types';
import { generateDynamicThemePrompt, generateBrandedImageService } from '../services/geminiService';
import { applyBrandingOverlay } from '../services/brandingOverlay';
import { saveToGallery } from '../services/galleryService';
import { injectS24UltraMetadata } from '../services/exifService';
import Loader from './Loader';
import Icon from './icons';

interface BrandingToolProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    initialImage?: { base64: string; mimeType: string } | null;
    onInitialImageConsumed?: () => void;
}

type CategoryId = 'classic' | 'vibrant' | 'lifestyle' | 'holiday' | 'model' | 'portrait';

const BrandingTool: React.FC<BrandingToolProps> = ({ langPack, showNotification, initialImage, onInitialImageConsumed }) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<{ base64: string; mimeType: string } | null>(null);
    const [brandedImages, setBrandedImages] = useState<string[] | null>(null);
    const [selectedBrandedImage, setSelectedBrandedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>('');
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<CategoryId>('classic');
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Preload an image handed off from the Staff Inbox
    useEffect(() => {
        if (!initialImage) return;
        setOriginalImage(`data:${initialImage.mimeType};base64,${initialImage.base64}`);
        setOriginalFile({ base64: initialImage.base64, mimeType: initialImage.mimeType });
        setBrandedImages(null);
        setSelectedBrandedImage(null);
        setActiveTemplateId(null);
        onInitialImageConsumed?.();
    }, [initialImage]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    const base64 = dataUrl.split(',')[1];
                    
                    setOriginalImage(dataUrl);
                    setBrandedImages(null);
                    setSelectedBrandedImage(null);
                    setActiveTemplateId(null);
                    setOriginalFile({ base64, mimeType: 'image/jpeg' });
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const scrollCategories = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const categories: { id: CategoryId; labelKey: keyof LanguagePack }[] = [
        { id: 'classic', labelKey: 'brandCategoryClassic' },
        { id: 'vibrant', labelKey: 'brandCategoryVibrant' },
        { id: 'lifestyle', labelKey: 'brandCategoryLifestyle' },
        { id: 'holiday', labelKey: 'brandCategoryHoliday' },
        { id: 'model', labelKey: 'brandCategoryModel' },
        { id: 'portrait', labelKey: 'brandCategoryPortrait' },
    ];

    const templatesByCategory: Record<CategoryId, { id: string; titleKey: keyof LanguagePack }[]> = {
        classic: [
            { id: 'studio', titleKey: 'templateStudioTitle' },
            { id: 'neutrals', titleKey: 'templateNeutralsTitle' },
            { id: 'mocha', titleKey: 'templateMochaTitle' },
        ],
        vibrant: [
            { id: 'vibrant', titleKey: 'templateVibrantTitle' },
            { id: 'seasonal', titleKey: 'templateSeasonalTitle' },
        ],
        lifestyle: [
            { id: 'lifestyle', titleKey: 'templateLifestyleTitle' },
            { id: 'sweater', titleKey: 'templateSweaterTitle' },
            { id: 'golden-spring', titleKey: 'templateGoldenSpringTitle' },
            { id: 'golden-summer', titleKey: 'templateGoldenSummerTitle' },
            { id: 'golden-fall', titleKey: 'templateGoldenFallTitle' },
            { id: 'golden-winter', titleKey: 'templateGoldenWinterTitle' },
            { id: 'golden-xmas', titleKey: 'templateGoldenXmasTitle' },
            { id: 'golden-ny', titleKey: 'templateGoldenNYTitle' },
        ],
        holiday: [
            { id: 'holiday-christmas', titleKey: 'holidayChristmas' },
            { id: 'holiday-newyear', titleKey: 'holidayNewYear' },
            { id: 'holiday-valentines', titleKey: 'holidayValentines' },
            { id: 'holiday-halloween', titleKey: 'holidayHalloween' },
            { id: 'holiday-thanksgiving', titleKey: 'holidayThanksgiving' },
            { id: 'holiday-mothersday', titleKey: 'holidayMothersDay' },
        ],
        model: [
            { id: 'model-urban', titleKey: 'templateModelUrbanTitle' },
            { id: 'model-luxury', titleKey: 'templateModelLuxuryTitle' },
            { id: 'model-smart', titleKey: 'templateModelSmartTitle' },
        ],
        portrait: [
            { id: 'portrait-glam', titleKey: 'templatePortraitGlamTitle' },
            { id: 'portrait-soft', titleKey: 'templatePortraitSoftTitle' },
            { id: 'portrait-edgy', titleKey: 'templatePortraitEdgyTitle' },
        ]
    };

    const getThemeDescription = (templateId: string): string => {
        const themes: Record<string, string> = {
            // Classic Category
            studio: "elegant_studio",
            neutrals: "modern_neutrals",
            mocha: "mocha_mood",

            // Vibrant Category
            vibrant: "vibrant_pop",
            seasonal: "seasonal_glow",
            
            // Lifestyle Category
            lifestyle: "lifestyle_luxury",
            sweater: "cozy_knit",
            'golden-spring': "golden_spring",
            'golden-summer': "golden_summer",
            'golden-fall': "golden_fall",
            'golden-winter': "golden_winter",
            'golden-xmas': "golden_xmas",
            'golden-ny': "golden_ny",

            // Holiday Category
            'holiday-christmas': "holiday_christmas",
            'holiday-newyear': "holiday_newyear",
            'holiday-valentines': "holiday_valentines",
            'holiday-halloween': "holiday_halloween",
            'holiday-thanksgiving': "holiday_thanksgiving",
            'holiday-mothersday': "holiday_mothersday",

            // Model Category - NEW MAPPINGS
            'model-urban': "model_urban",
            'model-luxury': "model_luxury",
            'model-smart': "model_smart",

            // Portrait Category - NEW MAPPINGS
            'portrait-glam': "portrait_glam",
            'portrait-soft': "portrait_soft",
            'portrait-edgy': "portrait_edgy",
        };
        return themes[templateId] || "Professional setting";
    };

    const generateBrandedImage = async (templateId: string) => {
        if (!originalFile) {
            showNotification('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setBrandedImages(null);
        setSelectedBrandedImage(null);
        setActiveTemplateId(templateId);

        try {
            setLoadingStage('Analyzing light source and anatomy physics...');
            const themeDescription = getThemeDescription(templateId);
            
            const fullPrompt = await generateDynamicThemePrompt(themeDescription, originalFile.base64, originalFile.mimeType);

            if (!fullPrompt) throw new Error('Failed to generate optimized prompt.');

            setLoadingStage('Rendering high-fidelity signature frames...');
            const results = await generateBrandedImageService(fullPrompt, originalFile.base64, originalFile.mimeType, "2K");

            if (results && results.length > 0) {
                setLoadingStage('Compositing real logo + contact details...');
                // Every branded image the user sees, selects, downloads, or saves
                // to the gallery must carry the REAL logo — never AI-drawn text.
                // applyBrandingOverlay throws on failure rather than silently
                // falling back to text, so a compositor failure surfaces here.
                const imageUrls = await Promise.all(results.map(r => applyBrandingOverlay(r)));
                setBrandedImages(imageUrls);
                setSelectedBrandedImage(imageUrls[0]);
                imageUrls.forEach(dataUrl => saveToGallery({
                    tool: 'Photo Branding',
                    style: templateId,
                    prompt: fullPrompt,
                    imageBase64: dataUrl.split(',')[1],
                }));
            } else {
                throw new Error('API returned no image data.');
            }
        } catch (error: any) {
            console.error("Error generating image:", error);
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    };

    const downloadCleanedImage = (dataUrl: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                
                const base64 = canvas.toDataURL('image/jpeg', 0.98);
                const metadataInjectedBase64 = injectS24UltraMetadata(base64);

                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const fileName = `SAMSUNG_S24_ULTRA_DURHAM_NC_${dateStr}.jpg`;
                
                const link = document.createElement('a');
                link.href = metadataInjectedBase64;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('Hardware-signed image downloaded!', 'success');
            }
        };
        img.src = dataUrl;
    };

    return (
        <div className="space-y-6 pb-20">
            {!originalImage ? (
                 <div className="relative">
                     <h2 className="font-display mb-6 px-2" style={{ fontSize: 'var(--text-h1)', color: 'var(--color-ink)' }}>{langPack.brandToolTitle}</h2>
                     <label className="flex flex-col items-center justify-center w-full aspect-[4/3] rounded-[2rem] border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer group ios-btn-press">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                             <Icon name="upload" className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-accent)] transition-colors" />
                        </div>
                        <p className="mt-4 text-gray-500 font-medium group-hover:text-gray-700">Tap to upload photo</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                 </div>
            ) : (
                <div className="animate-fade-in">
                    <div className="relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] border border-white/50">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                                <Loader />
                                <p className="mt-4 text-sm font-semibold text-[var(--color-accent)] animate-pulse px-6 text-center">{loadingStage}</p>
                            </div>
                        ) : null}
                        
                        <img 
                            src={selectedBrandedImage || originalImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                        
                        {selectedBrandedImage && !isLoading && (
                            <button 
                                onClick={() => downloadCleanedImage(selectedBrandedImage)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-[var(--color-accent)] ios-btn-press z-20 group"
                                title="Download Hardware Signed Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                        )}

                         <button onClick={() => setOriginalImage(null)} className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center shadow-lg text-white ios-btn-press z-20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {brandedImages && !isLoading && (
                        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar py-2">
                             {brandedImages.map((image, index) => (
                                <button key={index} onClick={() => setSelectedBrandedImage(image)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${selectedBrandedImage === image ? 'border-[var(--color-accent)] scale-105 shadow-md' : 'border-transparent opacity-70'}`}>
                                    <img src={image} alt={`Var ${index}`} className="w-full h-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8">
                        <div className="relative group mb-4">
                            <button 
                                onClick={() => scrollCategories('left')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 md:hidden"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </button>

                            <div 
                                ref={scrollContainerRef}
                                className="flex md:flex-wrap md:justify-center md:overflow-visible gap-2 overflow-x-auto no-scrollbar p-1 scroll-smooth"
                            >
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ios-btn-press ${activeCategory === cat.id ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {langPack[cat.labelKey] as string}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => scrollCategories('right')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity md:hidden"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1-0 1.414 0z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        
                        <div key={activeCategory} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {templatesByCategory[activeCategory].map((template, index) => (
                                <button 
                                    key={template.id} 
                                    onClick={() => generateBrandedImage(template.id)} 
                                    disabled={isLoading}
                                    style={{ 
                                        animation: `ios-stagger-up 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                                        animationDelay: `${index * 0.15}s`,
                                        opacity: 0
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50
                                    ${activeTemplateId === template.id ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent-tint)]' : 'border-gray-100'}`}
                                >
                                    <span className="text-sm font-semibold text-gray-800 text-center">{langPack[template.titleKey] as string}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandingTool;

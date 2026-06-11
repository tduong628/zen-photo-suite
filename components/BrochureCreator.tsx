
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LanguagePack } from '../types';
import { describeImageService, generateBrochureService } from '../services/geminiService';
import { saveToGallery } from '../services/galleryService';
import Loader from './Loader';
import Icon from './icons';

interface BrochureCreatorProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
}

interface BrochureFormState {
    headline: string;
    subheadline: string;
    price: string;
    block1Headline: string;
    block1Features: string[];
    block2Headline: string;
    block2Features: string[];
    cta: string;
    footer: string;
}

const initialState: BrochureFormState = {
    headline: 'Lavender Pedicure',
    subheadline: 'Treat Yourself with Our Lavender Pedicure!',
    price: '$45',
    block1Headline: 'Lavender Benefits:',
    block1Features: [
        'Deep Relaxation: Lavender’s calming properties help stress and promote relaxation.',
        'Soft & Smooth: Exfoliating gently removes dead skin, leaving your feet soft and smooth.',
        'Lasting Hydration: A lavender-infused cream deeply moisturizes and nourishes tired feet.',
        'Soothing Care: The combination of gentle massage and nourishing products leaves your feet feeling truly pampered.',
    ],
    block2Headline: '',
    block2Features: Array(4).fill(''),
    cta: 'Book Your Escape Today!',
    footer: 'Zen Nail Spa'
};

const BrochureCreator: React.FC<BrochureCreatorProps> = ({ langPack, showNotification }) => {
    const [formState, setFormState] = useState(initialState);
    const [selectedStyle, setSelectedStyle] = useState('luxury');
    const [referenceImage, setReferenceImage] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
    const [backgroundImages, setBackgroundImages] = useState<string[] | null>(null);
    const [selectedBg, setSelectedBg] = useState<string | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpscaling, setIsUpscaling] = useState(false);
    
    // Track the active prompt to re-run it in 4K
    const lastPromptRef = useRef<string | null>(null);
    
    const styles = [
        { id: 'luxury', key: 'brochureStyleLuxury' },
        { id: 'trendy', key: 'brochureStyleTrendy' },
        { id: 'elegant', key: 'brochureStyleElegant' },
        { id: 'natural', key: 'brochureStyleNatural' },
        { id: 'bold', key: 'brochureStyleBold' },
        { id: 'modern', key: 'brochureStyleModern' },
        { id: 'minimal', key: 'brochureStyleMinimal' },
        { id: 'professional', key: 'brochureStyleProfessional' },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };
    
    const handleFeatureChange = (block: 'block1' | 'block2', index: number, value: string) => {
        setFormState(prevState => {
            const features = block === 'block1' ? [...prevState.block1Features] : [...prevState.block2Features];
            features[index] = value;
            return {
                ...prevState,
                [block === 'block1' ? 'block1Features' : 'block2Features']: features
            };
        });
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Convert to supported JPEG to handle formats like AVIF
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
                    setReferenceImage({ url: dataUrl, base64, mimeType: 'image/jpeg' });
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const generateBrochurePrompt = async () => {
        let imageDescription = '';
        if (referenceImage) {
            try {
                const description = await describeImageService(referenceImage.base64, referenceImage.mimeType);
                if (description) {
                    imageDescription = ` It should be in a similar style to this description: "${description}"`;
                }
            } catch (error) {
                showNotification('Could not analyze reference image. Proceeding without it.', 'error');
            }
        }

        const stylePrompts: Record<string, string> = {
            elegant: `A background with a timeless, classic elegance. Graceful, soft, and sophisticated. Composition: A simple, soft textured background like fine linen. Soft, muted colors like dusty rose and cream. No clutter.`,
            luxury: `An ultra-luxurious, sophisticated spa background. Aesthetic: High-end, minimalist opulence. White or soft-grey marble texture with shimmering gold or rose-gold veining.`,
            modern: `A sharp, modern background using a 'Modern Geometric' style. Use bold geometric shapes and color blocking. Clean and contemporary.`,
            natural: `A background with a natural, organic feel. Earthy tones like greens, browns, and off-whites. light wood or textured paper textures.`,
            bold: `A bold, vibrant, and energetic background. Dynamic lines, overlapping elements, and large solid color blocks. High-impact abstract motion.`,
            trendy: `A chic, trendy, 'Instagram-style' background. Soft color palette with subtle gradients and shapes like arches.`,
            minimal: `A 'Clean & Minimal' background. Dominated by white space. Extremely simple, grid-based, providing a clean canvas.`,
            professional: `A 'Professional Corporate' background. Clean, structured, and informative. Strong grid and well-defined color blocks.`,
        };

        let dynamicThemePrompt = '';
        const combinedText = (formState.headline + ' ' + formState.subheadline).toLowerCase();
        if (combinedText.includes('lavender')) dynamicThemePrompt = 'Visual theme: calming lavender shades. Purple and lilac tones.';
        else if (combinedText.includes('green tea')) dynamicThemePrompt = 'Visual theme: fresh green tea. Earthy green tones.';
        else if (combinedText.includes('rose')) dynamicThemePrompt = 'Visual theme: romantic roses. Pink and red shades.';
        else if (combinedText.includes('gold')) dynamicThemePrompt = 'Visual theme: opulent gold and cream.';

        return `
You are a graphic designer creating a background for a flyer.
**CRITICAL:** 
- NO text, words, letters, numbers, or logos. 
- MUST be suitable for text overlay.
- NO human figures. 
- HIGH RESOLUTION.

**STYLE:** ${stylePrompts[selectedStyle]}${imageDescription}
**THEME:** ${dynamicThemePrompt || 'Professional nail salon background.'}
**OUTPUT:** Clean background image only. NO TEXT.`;
    };

    const handleGeneratePreview = async () => {
        if (!formState.headline) {
            showNotification('Please fill in the main Headline.');
            return;
        }

        setIsLoading(true);
        setBackgroundImages(null);
        setSelectedBg(null);
        setFinalImage(null);

        try {
            const prompt = await generateBrochurePrompt();
            lastPromptRef.current = prompt;
            const results = await generateBrochureService(prompt, "1K");
            if (results) {
                const imageUrls = results.map(r => `data:image/png;base64,${r}`);
                setBackgroundImages(imageUrls);
                setSelectedBg(imageUrls[0]);
                results.forEach(r => saveToGallery({
                    tool: 'Brochure Background',
                    style: selectedStyle,
                    prompt,
                    imageBase64: r,
                }));
            }
        } catch (error: any) {
            console.error(error);
            showNotification(langPack.errorApiGeneric);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload4K = async () => {
        if (!lastPromptRef.current) return;
        setIsUpscaling(true);
        try {
            // Render the background in 4K specifically for the download
            const results = await generateBrochureService(lastPromptRef.current, "4K");
            if (results && results[0]) {
                const highResBg = `data:image/png;base64,${results[0]}`;
                await generateAndDownloadFinal(highResBg, true);
            }
        } catch (e) {
            showNotification('HD render failed. Downloading preview quality.');
            if (selectedBg) await generateAndDownloadFinal(selectedBg, false);
        } finally {
            setIsUpscaling(false);
        }
    };

    const generateAndDownloadFinal = async (bgUrl: string, isHD: boolean) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = bgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Higher resolution for HD download
            const canvasWidth = isHD ? 2480 : 850;
            const canvasHeight = isHD ? 3508 : 1100;
            const scale = canvasWidth / 850;
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = text.split(' ');
                let line = '';
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        context.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                context.fillText(line, x, y);
                return y;
            };

            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.font = `bold ${60 * scale}px Inter, sans-serif`;
            ctx.fillText(formState.headline, canvasWidth / 2, 120 * scale);
            
            ctx.font = `${30 * scale}px Inter, sans-serif`;
            ctx.fillText(formState.subheadline, canvasWidth / 2, 170 * scale);

            if (formState.price) {
                ctx.save();
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(canvasWidth - (90 * scale), 90 * scale, 60 * scale, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = `bold ${40 * scale}px Inter, sans-serif`;
                ctx.fillText(formState.price, canvasWidth - (90 * scale), 100 * scale);
                ctx.restore();
            }

            let currentY = 280 * scale;
            ctx.textAlign = 'left';
            if (formState.block1Headline) {
                ctx.font = `bold ${28 * scale}px Inter, sans-serif`;
                ctx.fillText(formState.block1Headline, 80 * scale, currentY);
                currentY += 50 * scale;
                ctx.font = `${22 * scale}px Inter, sans-serif`;
                formState.block1Features.filter(f => f).forEach(feature => {
                    ctx.fillText('•', 80 * scale, currentY);
                    currentY = wrapText(ctx, feature, 110 * scale, currentY, 660 * scale, 32 * scale) + 20 * scale;
                });
            }

            const downloadUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `deluxe-brochure-${isHD ? 'hd' : 'preview'}.png`;
            link.click();
        };
    };

    const generateDownloadableImage = useCallback((bgUrl: string, data: BrochureFormState) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = bgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const canvasWidth = 850;
            const canvasHeight = 1100;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = text.split(' ');
                let line = '';
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        context.fillText(line, x, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                context.fillText(line, x, y);
                return y;
            };

            ctx.fillStyle = '#1f2937';
            ctx.textAlign = 'center';
            ctx.font = 'bold 60px Inter, sans-serif';
            ctx.fillText(data.headline, canvasWidth / 2, 120);
            ctx.font = '30px Inter, sans-serif';
            ctx.fillText(data.subheadline, canvasWidth / 2, 170);

            if (data.price) {
                ctx.save();
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(canvasWidth - 90, 90, 60, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 40px Inter, sans-serif';
                ctx.fillText(data.price, canvasWidth - 90, 100);
                ctx.restore();
            }

            let currentY = 280;
            ctx.textAlign = 'left';
            if (data.block1Headline) {
                ctx.font = 'bold 28px Inter, sans-serif';
                ctx.fillText(data.block1Headline, 80, currentY);
                currentY += 50;
                ctx.font = '22px Inter, sans-serif';
                data.block1Features.filter(f => f).forEach(feature => {
                    ctx.fillText('•', 80, currentY);
                    currentY = wrapText(ctx, feature, 110, currentY, 660, 32) + 20;
                });
            }
            
            setFinalImage(canvas.toDataURL('image/png'));
        };
    }, []);

    useEffect(() => {
        if (selectedBg) {
            generateDownloadableImage(selectedBg, formState);
        }
    }, [selectedBg, formState, generateDownloadableImage]);

    return (
        <div>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">{langPack.brochureToolTitle}</h2>
                <p className="text-gray-600 mt-2">{langPack.brochureToolDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-4">
                     <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="px-2 font-semibold text-amber-900">Style Reference (Optional)</legend>
                        <label className="cursor-pointer flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none hover:border-gray-400 focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <Icon name="upload" className="w-6 h-6 text-gray-600" />
                                <span className="font-medium text-gray-600">{langPack.brandToolUpload}</span>
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                         {referenceImage && (
                            <div className="mt-2">
                                <img src={referenceImage.url} alt="Reference" className="max-h-24 mx-auto rounded-md shadow-sm" />
                            </div>
                        )}
                    </fieldset>
                    
                    <fieldset className="border p-4 rounded-md space-y-4">
                        <legend className="px-2 font-semibold text-amber-900">Header Details</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{langPack.brochureToolHeadlineLabel}</label>
                            <input name="headline" value={formState.headline} onChange={handleInputChange} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-300 focus:ring-opacity-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{langPack.brochureToolSubheadlineLabel}</label>
                                <input name="subheadline" value={formState.subheadline} onChange={handleInputChange} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-300 focus:ring-opacity-50" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{langPack.brochureToolPriceLabel}</label>
                                <input name="price" value={formState.price} onChange={handleInputChange} type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-300 focus:ring-opacity-50" />
                            </div>
                        </div>
                    </fieldset>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{langPack.brochureToolStyleLabel}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {styles.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`p-3 text-sm font-medium border rounded-lg transition-colors ${selectedStyle === style.id ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-300' : 'bg-white border-gray-300 text-gray-700 hover:border-amber-500'}`}
                                >
                                    {langPack[style.key]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleGeneratePreview} disabled={isLoading || isUpscaling} className="w-full px-6 py-3 text-white font-semibold bg-amber-800 rounded-lg shadow-md hover:bg-amber-900 disabled:bg-amber-500 disabled:cursor-not-allowed transition-colors">
                        {langPack.brochureToolGenerateBtn}
                    </button>
                </div>
                <div>
                    <div className="h-full flex flex-col">
                        <label className="block text-sm font-medium text-gray-700">{langPack.brochureToolResultTitle}</label>
                        <div className="relative mt-1 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 aspect-[8.5/11]">
                            {(isLoading || isUpscaling) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 text-center px-4">
                                    <Loader />
                                    {isUpscaling && <p className="mt-4 text-xs font-bold text-amber-700 animate-pulse uppercase tracking-widest">Mastering 4K HD Print...</p>}
                                </div>
                            )}
                            {finalImage && !isLoading && (
                                <img src={finalImage} alt="Generated brochure preview" className="w-full h-full object-contain" />
                            )}
                            {!finalImage && !isLoading && (
                                 <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                                    <Icon name="brochure" className="w-12 h-12 text-gray-300" />
                                    <h3 className="font-semibold text-lg mt-4">Brochure Preview</h3>
                                    <p className="mt-2 text-sm">Fill details and generate 1K previews.</p>
                                </div>
                            )}
                        </div>
                        {backgroundImages && !isLoading && !isUpscaling && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-600 mb-2 text-center">Choose a preview:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {backgroundImages.map((bg, index) => (
                                        <button key={index} onClick={() => setSelectedBg(bg)} className={`rounded-lg overflow-hidden border-2 transition-colors ${selectedBg === bg ? 'border-amber-500 ring-2 ring-amber-200' : 'border-transparent hover:border-amber-300'}`}>
                                            <img src={bg} alt={`Variant ${index + 1}`} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {finalImage && !isLoading && !isUpscaling && (
                            <div className="mt-4 text-center">
                                <button 
                                    onClick={handleDownload4K}
                                    className="w-full px-6 py-2.5 text-white font-semibold bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download 4K HD
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrochureCreator;


import React, { useState } from 'react';
import { LanguagePack } from '../types';
import { generateLandingPageService } from '../services/geminiService';
import { logoBase64 } from './assets';
import Loader from './Loader';

interface LandingPageCreatorProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    initialData?: any[] | null;
}

type Tone = 'professional' | 'exciting' | 'benefit';
type Layout = 'single' | 'imageLeft' | 'imageRight';

const LandingPageCreator: React.FC<LandingPageCreatorProps> = ({ langPack, showNotification, initialData }) => {
    const [tone, setTone] = useState<Tone>('professional');
    const [layout, setLayout] = useState<Layout>('single');
    const [generatedHtml, setGeneratedHtml] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const tones: { id: Tone, key: keyof LanguagePack }[] = [
        { id: 'professional', key: 'landingPageToneProfessional' },
        { id: 'exciting', key: 'landingPageToneExciting' },
        { id: 'benefit', key: 'landingPageToneBenefit' },
    ];

    const layouts: { id: Layout, key: keyof LanguagePack }[] = [
        { id: 'single', key: 'landingPageLayoutSingle' },
        { id: 'imageLeft', key: 'landingPageLayoutImageLeft' },
        { id: 'imageRight', key: 'landingPageLayoutImageRight' },
    ];
    
    const handleGenerateLandingPage = async () => {
        if (!initialData || initialData.length === 0) {
            showNotification('Please select promotion ideas first.', 'error');
            return;
        }

        setIsLoading(true);
        setGeneratedHtml('');
        
        const promotionsText = initialData.map(p => `- ${p.name}: ${p.offer}`).join('\n');
        
        const prompt = `You are an expert web developer and copywriter creating a high-converting landing page for "Zen Nail Spa".

**Salon Information:**
- Name: Zen Nail Spa
- Phone: (919) 316-7856
- Address: 105 NC-54 Hwy, Ste 277A, Durham, NC 27713

**Promotions to Feature:**
${promotionsText}

**Tone:** ${tone}
**Layout:** ${layout}

**TASK:**
Generate a complete, single HTML file. The HTML must be fully responsive and styled using Tailwind CSS (via CDN: https://cdn.tailwindcss.com).

**REQUIREMENTS:**
1.  **HTML Structure:** Respond with ONLY raw HTML code, starting with \`<!DOCTYPE html>\` and ending with \`</html>\`.
2.  **Header:** Include a header with the salon name. Use this base64 encoded logo: '${logoBase64}'. The logo is 240x80 pixels.
3.  **Hero Section:** Create a compelling hero section with a strong headline based on the promotions.
4.  **Promotions Section:** Clearly list and describe the promotions provided above.
5.  **Call to Action (CTA):** Include a prominent "Book Now" button that links to the salon's phone number (\`tel:+19199165963\`).
6.  **Footer:** A simple footer with the salon's name, address, and phone number.
7.  **Images:** Use high-quality, relevant placeholder images from unsplash.com. For example: \`https://source.unsplash.com/800x600/?nail,salon\`. Ensure images fit the layout and theme.
8.  **Styling:**
    -   Use the Inter font from Google Fonts.
    -   The design must match the requested **TONE**:
        -   **professional:** Clean, elegant design. Use a sophisticated color palette (e.g., soft pinks, grays, whites, gold accents).
        -   **exciting:** Vibrant, energetic design. Use bold colors, strong contrasts, and dynamic language to create urgency.
        -   **benefit-focused:** Calm, relaxing design. Use a soothing color palette (e.g., muted greens, blues, beiges) and focus on the experience of relaxation and self-care.
    -   The design must match the requested **LAYOUT**:
        -   **single:** A clean, single-column layout.
        -   **imageLeft:** A two-column layout for the main content, with an image on the left and text on the right.
        -   **imageRight:** A two-column layout for the main content, with text on the left and an image on the right.
9.  **NO Javascript:** Do not include any \`<script>\` tags or inline javascript.
10. **Content:** The copy should be persuasive and reflect the chosen tone.

Begin the HTML now.`;

        try {
            const result = await generateLandingPageService(prompt);
            if (result) {
                setGeneratedHtml(result);
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
            setIsLoading(false);
        }
    };
    
    const copyHtml = () => {
        navigator.clipboard.writeText(generatedHtml).then(() => {
            showNotification('HTML copied to clipboard!', 'success');
        });
    };

    const downloadHtml = () => {
        const blob = new Blob([generatedHtml], { type: 'text/html' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'landing-page.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    return (
        <div>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800">{langPack.landingPageToolTitle}</h2>
                <p className="text-gray-600 mt-2">{langPack.landingPageToolDesc}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-6">
                    {initialData && initialData.length > 0 ? (
                        <div className="p-4 bg-gray-50 border rounded-lg">
                            <h3 className="font-semibold text-gray-700 mb-2">{langPack.landingPageSelectedPromos}</h3>
                            <ul className="space-y-2">
                                {initialData.map((promo, index) => (
                                    <li key={index} className="p-2 bg-white border rounded-md text-sm">
                                        <p className="font-bold text-gray-800">{promo.name}</p>
                                        <p className="text-gray-600">{promo.offer}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                         <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                             <p className="text-sm text-yellow-800">Go to the "Promotion Idea AI" tool to select promotions first.</p>
                         </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{langPack.landingPageToneLabel}</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tones.map(t => (
                                <button key={t.id} onClick={() => setTone(t.id)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors duration-200 ${tone === t.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                    {langPack[t.key] as string}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">{langPack.landingPageLayoutLabel}</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {layouts.map(l => (
                                <button key={l.id} onClick={() => setLayout(l.id)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors duration-200 ${layout === l.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                    {langPack[l.key] as string}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleGenerateLandingPage} disabled={isLoading || !initialData || initialData.length === 0} className="w-full px-6 py-3 text-white font-semibold bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? 'Generating...' : langPack.landingPageGenerateBtn}
                    </button>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg border flex flex-col">
                    <div className="bg-white shadow-lg rounded-lg h-full overflow-hidden flex-1">
                       {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader />
                            </div>
                        ) : generatedHtml ? (
                             <iframe
                                srcDoc={generatedHtml}
                                title="Landing Page Preview"
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        ) : (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                                <svg className="w-12 h-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" /></svg>
                                <h3 className="font-semibold text-lg mt-4">Landing Page Preview</h3>
                                <p className="mt-2 text-sm">Configure your page and click "Generate" to see the result.</p>
                            </div>
                        )}
                    </div>
                     {generatedHtml && !isLoading && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button onClick={copyHtml} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors shadow-sm">
                                Copy HTML
                            </button>
                             <button onClick={downloadHtml} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                                Download HTML
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandingPageCreator;

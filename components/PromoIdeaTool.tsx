
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { LanguagePack, ChatMessage } from '../types';
import { generatePromoIdeasService } from '../services/geminiService';
import Loader from './Loader';
import Icon from './icons';

interface PromoIdeaToolProps {
    langPack: LanguagePack;
    showNotification: (message: string, type?: 'error' | 'success') => void;
    goToPromoGenerator: (title: string, offer: string, offer2?: string) => void;
    handleAddPromos: (promos: any[]) => void;
    goToLandingPage: (promos: any[]) => void;
}

type Mode = 'initial' | 'questionnaire' | 'results' | 'chatbot';

const questionnaireConfig = [
    { id: 'q1', titleKey: 'q1Title', promptKey: 'q1Prompt', type: 'single', options: ['q1o1', 'q1o2', 'q1o3', 'q1o4', 'q1o5'] },
    { id: 'q2', titleKey: 'q2Title', promptKey: 'q2Prompt', type: 'single', options: ['q2o1', 'q2o2', 'q2o3', 'q2o4'] },
    {
        id: 'q3', titleKey: 'q3Title', promptKey: 'q3Prompt', type: 'single', options: ['q3o1', 'q3o2', 'q3o3', 'q3o4'],
        subQuestions: {
            'q3o2': { id: 'q3sp', titleKey: 'q3subPremium', type: 'multi', options: ['q3sp1', 'q3sp2', 'q3sp3', 'q3sp4', 'q3sp5'] },
            'q3o3': { id: 'q3sc', titleKey: 'q3subCombo', type: 'multi', options: ['q3sc1', 'q3sc2', 'q3sc3', 'q3sc4', 'q3sc5', 'q3sc6'] }
        }
    },
    { id: 'q4', titleKey: 'q4Title', promptKey: 'q4Prompt', type: 'single', options: ['q4o1', 'q4o2', 'q4o3', 'q4o4'] },
    { id: 'q5', titleKey: 'q5Title', promptKey: 'q5Prompt', type: 'single', options: ['q5o1', 'q5o2', 'q5o3', 'q5o4'] },
    { id: 'q6', titleKey: 'q6Title', promptKey: 'q6Prompt', type: 'single', options: ['q6o1', 'q6o2', 'q6o3', 'q6o4', 'q6o5'] },
    { id: 'q7', titleKey: 'q7Title', promptKey: 'q7Prompt', type: 'text', otherKey: 'q7Other' },
    { id: 'q8', titleKey: 'q8Title', promptKey: 'q8Prompt', type: 'single', options: ['q8o1', 'q8o2', 'q8o3', 'q8o4'] }
];


const PromoIdeaTool: React.FC<PromoIdeaToolProps> = ({ langPack, showNotification, goToPromoGenerator, handleAddPromos, goToLandingPage }) => {
    const [mode, setMode] = useState<Mode>('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [ideas, setIdeas] = useState<any[]>([]);
    const [selectedIdeas, setSelectedIdeas] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    
    // Chatbot state
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, isLoading]);

    const handleStartDeepDive = () => {
        setAnswers({});
        setCurrentStep(0);
        setMode('questionnaire');
    };
    
     const handleRestart = () => {
        setMode('initial');
        setAnswers({});
        setCurrentStep(0);
        setIdeas([]);
        setSelectedIdeas([]);
    };
    
    const handleStartChatbot = () => {
        setChatHistory([
            { role: 'model', content: langPack.chatbotWelcomeMessage }
        ]);
        setUserInput('');
        setChat(null);
        setMode('chatbot');
    };

    const handleAnswerSelect = (questionId: string, optionKey: string, type: 'single' | 'multi' = 'single') => {
        setAnswers(prev => {
            const newAnswers = { ...prev };
            if (type === 'multi') {
                const currentSelection = newAnswers[questionId] || [];
                if (currentSelection.includes(optionKey)) {
                    newAnswers[questionId] = currentSelection.filter((item: string) => item !== optionKey);
                } else {
                    newAnswers[questionId] = [...currentSelection, optionKey];
                }
            } else {
                // If changing a single answer, clear sub-question answers
                const question = questionnaireConfig.find(q => q.id === questionId);
                if (question && 'subQuestions' in question && question.subQuestions) {
                    Object.values(question.subQuestions).forEach(subQ => {
                        delete newAnswers[subQ.id];
                    });
                }
                newAnswers[questionId] = optionKey;
            }
            return newAnswers;
        });
    };

    const handleTextChange = (questionId: string, value: string) => {
        setAnswers(prev => ({...prev, [questionId]: value}));
    };

    const formatAnswersForPrompt = () => {
        let promptString = "Analyze the following strategic business goals and generate 3 targeted promotion ideas:\n";
        
        const keyToTitleMap: Record<string, string> = {
            q1: "Main Business Goal",
            q2: "Target Audience",
            q3: "Service Focus",
            q3sp: "Specific Premium Services",
            q3sc: "Specific Combo Deal",
            q4: "Desired Customer Experience",
            q5: "Financial Goal",
            q6: "Branding Connection",
            q7: "Competitive Edge",
            q8: "Restrictions",
        };

        questionnaireConfig.forEach(q => {
            const answer = answers[q.id];
            if (answer) {
                const title = keyToTitleMap[q.id];
                const answerText = langPack[answer] || answer;
                promptString += `- ${title}: ${answerText}\n`;

                if (q.subQuestions && q.subQuestions[answer]) {
                    const subQ = q.subQuestions[answer];
                    const subAnswer = answers[subQ.id];
                    if (subAnswer && subAnswer.length > 0) {
                        const subTitle = keyToTitleMap[subQ.id];
                        const subAnswerText = subAnswer.map((key: string) => langPack[key]).join(', ');
                        promptString += `- ${subTitle}: ${subAnswerText}\n`;
                    }
                }
            }
        });

        return promptString;
    };

    const handleGenerate = async (isInstant: boolean) => {
        setIsLoading(true);
        setMode('results');
        setIdeas([]);
        setSelectedIdeas([]);

        const answersPrompt = isInstant
            ? `**TASK:** Generate 3 general, high-quality promotion ideas. Base your ideas on common salon strategies like seasonal events, popular service pairings, or upselling opportunities.`
            : `**TASK:** ${formatAnswersForPrompt()}`;
        
        const prompt = `You are a master salon marketing consultant for "Zen Nail Spa". Your task is to generate 3 unique, creative, and profitable promotion ideas using the salon's actual price list and business rules.

**SALON PRICE LIST FOR CONTEXT:**
- SNS/Dipping Powder: $50
- Gel X: $60
- Basic Manicure/Pedicure: $22/$35
- Gel Manicure/Pedicure: $37/$50
- Premium Pedicures ($55+): Orange/Ocean Breeze ($55), Matcha & Expresso ($65), Romantic Rose ($75), Collagen ($80), Herbal Detox ($85).

**CRITICAL FINANCIAL CONSTRAINTS:**
- The salon pays its technicians a 60% commission.
- Therefore, any promotion's total discount value CANNOT EXCEED 20% of the service price.
- You MUST respect this 20% cap. Prioritize creating value through packages or add-ons instead of discounts.

${answersPrompt}

For each of the 3 ideas, provide:
- "name": A catchy, memorable name.
- "offer": The core offer summarized in a short, direct phrase suitable for a headline (e.g., "$15 OFF Gel Mani & Premium Pedi").
- "description": A more detailed explanation.
- "marketingAngle": A short sentence on how to market it.
- "whyItWorks": A brief analysis of why this idea meets the salon's goals.

Respond with ONLY a valid JSON array of objects. Each object must contain the five keys: "name", "offer", "description", "marketingAngle", and "whyItWorks".`;
        
        try {
            const result = await generatePromoIdeasService(prompt);
            if (result) {
                const parsedIdeas = JSON.parse(result);
                setIdeas(parsedIdeas);
            } else {
                showNotification(langPack.errorApiGeneric);
            }
        } catch (error: any) {
            console.error(error);
            if (error.toString().includes('429') || error.toString().includes('RESOURCE_EXHAUSTED')) {
                showNotification(langPack.errorApiRateLimit);
            } else {
                showNotification(langPack.errorApiGeneric);
            }
        } finally {
            setIsLoading(false);
        }
    }
    
     const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const currentMessage = userInput;
        setChatHistory(prev => [...prev, { role: 'user', content: currentMessage }]);
        setUserInput('');
        setIsLoading(true);

        let chatInstance = chat;
        if (!chatInstance) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemInstruction = `You are a master salon marketing consultant for "Zen Nail Spa". Your task is to have a conversation with a salon staff member to brainstorm and refine unique, creative, and profitable promotion ideas.
**Key Context:**
- Salon Name: Zen Nail Spa
- Goal: Create actionable promotions.
**CRITICAL FINANCIAL CONSTRAINTS:**
- The salon pays its technicians a 60% commission.
- Therefore, any promotion's total discount value CANNOT EXCEED 20% of the service's retail price.
- You MUST respect this 20% cap. Prioritize creating value through packages or add-ons instead of large discounts.
**Your Role:**
- Be friendly, encouraging, and conversational.
- Ask clarifying questions to understand the user's goals (e.g., "Who is this for?", "What services do you want to highlight?", "What's our goal for this month?").
- Proactively suggest ideas and build upon the user's input.
- When you provide a fully-formed promotion idea, structure it clearly with a name, offer, and a brief description.`;
            chatInstance = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: { systemInstruction }
            });
            setChat(chatInstance);
        }

        setChatHistory(prev => [...prev, { role: 'model', content: '' }]);

        try {
            const result = await chatInstance.sendMessageStream({ message: currentMessage });
            
            for await (const chunk of result) {
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].content += chunk.text;
                    return newHistory;
                });
            }
        } catch (error) {
            setChatHistory(prev => {
                 const newHistory = [...prev];
                 newHistory[newHistory.length - 1].content = langPack.errorApiGeneric;
                 return newHistory;
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };


    const handleSelectIdea = (ideaToToggle: any) => {
        setSelectedIdeas(prev => {
            const isAlreadySelected = prev.some(idea => idea.name === ideaToToggle.name);
            if (isAlreadySelected) {
                return prev.filter(idea => idea.name !== ideaToToggle.name);
            } else {
                if (prev.length < 2) {
                    return [...prev, ideaToToggle];
                } else {
                    showNotification("You can select up to 2 ideas.", "error");
                    return prev;
                }
            }
        });
    };
    
    const handleCreateGraphic = () => {
        if (selectedIdeas.length === 1) {
            goToPromoGenerator(selectedIdeas[0].name, selectedIdeas[0].offer);
        } else if (selectedIdeas.length === 2) {
            goToPromoGenerator('Special Double Offer!', selectedIdeas[0].offer, selectedIdeas[1].offer);
        }
    };
    
    const renderQuestionnaire = () => {
        const question = questionnaireConfig[currentStep];
        if (!question) return null;

        const mainAnswer = answers[question.id];
        const subQuestion = question.subQuestions ? question.subQuestions[mainAnswer] : null;

        return (
            <div className="w-full">
                <div className="mb-4">
                    <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                            <div style={{ width: `${((currentStep + 1) / questionnaireConfig.length) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"></div>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{langPack[question.titleKey]}</h3>
                    <p className="text-gray-600 mt-1">{langPack[question.promptKey]}</p>
                </div>
                
                {question.type === 'text' ? (
                     <textarea
                        value={answers[question.id] || ''}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder={langPack[question.otherKey]}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {question.options.map(optionKey => (
                            <button
                                key={optionKey}
                                onClick={() => handleAnswerSelect(question.id, optionKey, 'single')}
                                className={`text-left p-4 border rounded-lg transition-all ${answers[question.id] === optionKey ? 'bg-indigo-100 border-indigo-500 text-indigo-900' : 'bg-white hover:bg-indigo-50 text-gray-800'}`}
                            >
                                {langPack[optionKey]}
                            </button>
                        ))}
                    </div>
                )}

                {subQuestion && (
                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                         <h4 className="font-semibold text-gray-800">{langPack[subQuestion.titleKey]}</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {subQuestion.options.map(optionKey => (
                                <button
                                    key={optionKey}
                                    onClick={() => handleAnswerSelect(subQuestion.id, optionKey, 'multi')}
                                    className={`text-left p-3 border-2 rounded-lg text-sm transition-all ${(answers[subQuestion.id] || []).includes(optionKey) ? 'bg-indigo-200 border-indigo-600 text-indigo-900' : 'bg-white hover:bg-indigo-100 text-gray-800'}`}
                                >
                                    {langPack[optionKey]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-8">
                    <button onClick={() => currentStep > 0 ? setCurrentStep(c => c-1) : setMode('initial')} className="px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700">
                        {langPack.ideaToolBack}
                    </button>
                     {currentStep < questionnaireConfig.length - 1 ? (
                        <button onClick={() => setCurrentStep(c => c + 1)} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                            {langPack.ideaToolNext}
                        </button>
                    ) : (
                        <button onClick={() => handleGenerate(false)} className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                            {langPack.ideaToolSubmit}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderChatbot = () => {
        const TypingIndicator = () => (
             <div className="flex items-center space-x-1.5 p-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
        );

        return (
            <div className="flex flex-col h-[600px] bg-white border rounded-xl shadow-lg">
                <div className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-xl">
                    <button onClick={() => setMode('initial')} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        {langPack.ideaToolBack}
                    </button>
                    <h3 className="text-lg font-bold text-slate-800">{langPack.ideaToolChatbotTitle}</h3>
                    <div className="w-20"></div>
                </div>
                
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm">AI</div>
                            )}
                            <div className={`max-w-md lg:max-w-lg p-3 rounded-xl shadow-md ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-white text-gray-900 rounded-bl-lg'}`}>
                               {isLoading && msg.role === 'model' && index === chatHistory.length - 1 && msg.content === '' ? (
                                   <TypingIndicator />
                               ) : (
                                   <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                               )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center bg-white rounded-b-xl">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={langPack.chatbotInputPlaceholder}
                        className="flex-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="ml-3 inline-flex items-center justify-center w-11 h-11 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <Icon name="send" className="w-5 h-5" />
                    </button>
                </form>
            </div>
        );
    };

    const renderContent = () => {
        switch(mode) {
            case 'chatbot':
                return renderChatbot();
            case 'questionnaire':
                return renderQuestionnaire();
            case 'results':
                return (
                     <div>
                        <div className="text-center mb-6">
                             <h2 className="text-2xl font-bold text-gray-800">{langPack.ideaToolResultTitle}</h2>
                             <p className="text-gray-600 mt-1">Select up to 2 ideas to take action.</p>
                        </div>
                         {isLoading ? (
                            <div className="flex justify-center items-center my-8"><Loader /></div>
                        ) : (
                            <div className="space-y-4">
                                {ideas.map((idea, index) => {
                                    const isSelected = selectedIdeas.some(i => i.name === idea.name);
                                    return (
                                        <div key={index} className={`bg-indigo-50 border-2 p-4 rounded-lg shadow-sm transition-all duration-200 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-indigo-200'}`}>
                                            <label className="flex items-start cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectIdea(idea)}
                                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                                                />
                                                <div className="ml-4 flex-1">
                                                    <h3 className="text-lg font-bold text-indigo-900">{idea.name}</h3>
                                                    <p className="text-md text-indigo-800 font-semibold mb-2">{idea.offer}</p>
                                                    <p className="text-sm text-gray-700 mb-2"><strong className="font-semibold">Description:</strong> {idea.description}</p>
                                                    <p className="text-sm text-gray-700 mb-2"><strong className="font-semibold">Marketing Angle:</strong> {idea.marketingAngle}</p>
                                                    <p className="text-sm text-gray-600"><strong className="font-semibold">Why It Works:</strong> {idea.whyItWorks}</p>
                                                </div>
                                            </label>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {selectedIdeas.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button onClick={() => handleAddPromos(selectedIdeas)} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">
                                        {langPack.ideaToolAddToPromoBtn}
                                    </button>
                                    <button onClick={() => goToLandingPage(selectedIdeas)} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-colors shadow-sm">
                                        {langPack.ideaToolCreateLandingPageBtn}
                                    </button>
                                    <button onClick={handleCreateGraphic} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
                                        {langPack.ideaToolCreateGraphicBtn}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button onClick={handleRestart} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                                {langPack.ideaToolRestart}
                            </button>
                        </div>
                    </div>
                );
            case 'initial':
            default:
                 return (
                    <div className="space-y-4">
                        <button onClick={() => handleGenerate(true)} className="w-full text-left p-6 bg-indigo-100 border-2 border-indigo-200 rounded-xl shadow-sm hover:bg-indigo-200 transition-colors">
                            <h3 className="text-lg font-semibold text-indigo-900">{langPack.ideaToolInstantTitle}</h3>
                            <p className="text-sm text-indigo-700 mt-1">{langPack.ideaToolInstantDesc}</p>
                        </button>
                        <button onClick={handleStartDeepDive} className="w-full text-left p-6 bg-gray-100 border-2 border-gray-200 rounded-xl shadow-sm hover:bg-gray-200 transition-colors">
                            <h3 className="text-lg font-semibold text-gray-900">{langPack.ideaToolDeepDiveTitle}</h3>
                            <p className="text-sm text-gray-700 mt-1">{langPack.ideaToolDeepDiveDesc}</p>
                        </button>
                        <button onClick={handleStartChatbot} className="w-full text-left p-6 bg-amber-100 border-2 border-amber-200 rounded-xl shadow-sm hover:bg-amber-200 transition-colors">
                            <div className="flex items-center">
                                <Icon name="chatbot" className="w-8 h-8 text-amber-800 mr-4" />
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-900">{langPack.ideaToolChatbotTitle}</h3>
                                    <p className="text-sm text-amber-800 mt-1">{langPack.ideaToolChatbotDesc}</p>
                                </div>
                            </div>
                        </button>
                    </div>
                );
        }
    };

    return (
        <div>
             <div className="text-center mb-6">
                 {mode !== 'chatbot' && (
                     <>
                        <h2 className="text-2xl font-bold text-gray-800">{langPack.ideaToolTitle}</h2>
                        <p className="text-gray-600 mt-2">{langPack.ideaToolDesc}</p>
                     </>
                 )}
            </div>
            {renderContent()}
        </div>
    );
};

export default PromoIdeaTool;

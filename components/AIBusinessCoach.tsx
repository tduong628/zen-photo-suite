
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAiBlob } from "@google/genai";
import { LanguagePack } from '../types';
import Icon from './icons';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const AIBusinessCoach: React.FC<{ langPack: LanguagePack, showNotification: (message: string, type?: 'error' | 'success') => void; }> = ({ langPack, showNotification }) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ user: string; model: string; isFinal: boolean }[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);
    const transcriptionContainerRef = useRef<HTMLDivElement>(null);
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');

    const cleanup = useCallback(() => {
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
        }
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close().catch(console.error);
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        outputAudioContextRef.current?.close().catch(console.error);

        sessionPromiseRef.current?.then(session => session.close()).catch(e => console.error("Error closing session:", e));

        sessionPromiseRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        mediaStreamRef.current = null;
        setIsSessionActive(false);
        setStatus('idle');
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    useEffect(() => {
        if (transcriptionContainerRef.current) {
            transcriptionContainerRef.current.scrollTop = transcriptionContainerRef.current.scrollHeight;
        }
    }, [transcriptionHistory, currentInput, currentOutput]);

    const startSession = async () => {
        setStatus('connecting');
        setTranscriptionHistory([]);
        setCurrentInput('');
        setCurrentOutput('');
        currentInputRef.current = '';
        currentOutputRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const systemInstruction = "You are 'Deluxe AI Coach', a world-class business consultant specializing in the nail salon industry. Your tone is professional, encouraging, and highly knowledgeable. Your goal is to help the salon owner or staff member identify opportunities, solve problems, and scale their business. You should proactively ask insightful questions about their marketing, operations, finances, customer service, and team management. Provide concrete, actionable advice. Reference the salon's name, 'Zen Nail Spa', when relevant. Begin the conversation by introducing yourself and asking about their current business challenges or goals.";

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: GenAiBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);

                        setIsSessionActive(true);
                        setStatus('listening');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setStatus('listening');
                            const text = message.serverContent.inputTranscription.text;
                            currentInputRef.current += text;
                            setCurrentInput(currentInputRef.current);
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            setStatus('speaking');
                            const audioContext = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                            const source = audioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContext.destination);
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputRef.current += text;
                            setCurrentOutput(currentOutputRef.current);
                        }

                        if (message.serverContent?.turnComplete) {
                            setTranscriptionHistory(prev => [...prev, { user: currentInputRef.current, model: currentOutputRef.current, isFinal: true }]);
                            currentInputRef.current = '';
                            currentOutputRef.current = '';
                            setCurrentInput('');
                            setCurrentOutput('');
                            setStatus('listening');
                        }
                        
                         if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                                sourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        showNotification(langPack.coachStatusError, 'error');
                        setStatus('error');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
            });
        } catch (err) {
            console.error(err);
            showNotification(langPack.coachMicPermissionError, 'error');
            setStatus('error');
        }
    };
    
    const handleToggleSession = () => {
        if (isSessionActive) {
            cleanup();
        } else {
            startSession();
        }
    };

    const statusMap = {
        idle: { text: langPack.coachStatusIdle, color: 'text-gray-400' },
        connecting: { text: langPack.coachStatusConnecting, color: 'text-yellow-400' },
        listening: { text: langPack.coachStatusListening, color: 'text-green-400' },
        speaking: { text: langPack.coachStatusSpeaking, color: 'text-blue-400' },
        error: { text: langPack.coachStatusError, color: 'text-red-400' },
    };

    return (
        <div className="flex flex-col items-center justify-between min-h-[600px] text-white bg-gray-900 rounded-lg p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/30 to-gray-900 opacity-50"></div>
            <div className="w-full text-center z-10">
                <h2 className="text-2xl font-bold">{langPack.coachTitle}</h2>
                <p className="text-gray-400 mt-1">{langPack.coachDesc}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center my-4 z-10">
                 <p className={`mb-4 text-lg font-medium ${statusMap[status].color}`}>{statusMap[status].text}</p>
                 <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${isSessionActive ? 'bg-fuchsia-500/20' : 'bg-gray-700'}`}>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isSessionActive ? 'bg-fuchsia-500/40' : 'bg-gray-600'}`}>
                         <button onClick={handleToggleSession} className={`w-20 h-20 rounded-full text-white flex items-center justify-center transition-colors duration-300 shadow-lg ${isSessionActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            <Icon name={isSessionActive ? 'phone' : 'brain'} className="w-8 h-8"/>
                        </button>
                    </div>
                 </div>
            </div>

            <div ref={transcriptionContainerRef} className="w-full h-48 bg-black/30 rounded-lg p-4 overflow-y-auto z-10 space-y-3 text-sm">
                {transcriptionHistory.map((turn, index) => (
                    <div key={index}>
                        <p><strong className="text-fuchsia-400">You:</strong> {turn.user}</p>
                        <p><strong className="text-cyan-400">AI:</strong> {turn.model}</p>
                    </div>
                ))}
                {(currentInput || currentOutput) && (
                     <div>
                        {currentInput && <p><strong className="text-fuchsia-400">You:</strong> {currentInput}</p>}
                        {currentOutput && <p><strong className="text-cyan-400">AI:</strong> {currentOutput}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIBusinessCoach;

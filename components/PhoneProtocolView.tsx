import React from 'react';
import Icon from './icons';

const PhoneProtocolView: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;

    const { title, steps, commonQuestions } = data;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center">{title}</h2>
            
            <div className="space-y-6">
                {steps.map((step: any) => (
                    <div key={step.stepNumber} className="flex items-start">
                        <div className="flex-shrink-0 flex flex-col items-center mr-6">
                            <div className="w-12 h-12 bg-yellow-400 text-white flex items-center justify-center rounded-full font-bold text-xl shadow-md">
                                {step.stepNumber}
                            </div>
                            {step.stepNumber < steps.length && <div className="w-px h-8 bg-gray-300 mt-2"></div>}
                        </div>
                        <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-yellow-800">{step.title}</h3>
                            <blockquote className="mt-2 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-gray-700 italic rounded-r-lg">
                                {step.script}
                            </blockquote>
                            {step.proTips && (
                                <div className="mt-4 space-y-2">
                                    {step.proTips.map((tip: string, index: number) => (
                                        <div key={index} className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {commonQuestions && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center mb-4">
                        <Icon name="help" className="w-8 h-8 text-yellow-700 mr-3" />
                        <h3 className="text-2xl font-bold text-yellow-800">{commonQuestions.title}</h3>
                    </div>
                    <div className="space-y-4">
                        {commonQuestions.questions.map((q: any, index: number) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="font-semibold text-gray-800">{q.question}</p>
                                <p className="mt-1 text-gray-600">{q.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneProtocolView;
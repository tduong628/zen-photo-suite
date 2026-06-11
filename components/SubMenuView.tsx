import React from 'react';
import { LanguagePack, View } from '../types';

interface SubMenuViewProps {
    langPack: LanguagePack;
    categoryId: string;
    onNavigate: (view: View, categoryId: string, subcategoryId: string) => void;
}

const SubMenuView: React.FC<SubMenuViewProps> = ({ langPack, categoryId, onNavigate }) => {
    const categoryData = langPack.content[categoryId];
    const subcategories = categoryData?.subcategories;
    const intro = categoryData?.intro;

    if (!subcategories) {
        return <p>No subcategories found.</p>;
    }
    
    const categoryStyles = {
        walkin: { 
            gradient: 'bg-gradient-to-tr from-green-100 to-green-300', 
            text: 'text-green-900',
            introBg: 'bg-green-50',
            introBorder: 'border-green-200',
            introTitle: 'text-green-800',
            scriptBg: 'bg-green-100',
            scriptBorder: 'border-green-300'
        }
    };
    
    const style = categoryStyles[categoryId as keyof typeof categoryStyles] || { 
        gradient: 'bg-gradient-to-tr from-gray-100 to-gray-300', 
        text: 'text-gray-900',
        introBg: 'bg-gray-50',
        introBorder: 'border-gray-200',
        introTitle: 'text-gray-800',
        scriptBg: 'bg-gray-100',
        scriptBorder: 'border-gray-300'
    };

    return (
        <div>
            {intro && typeof intro === 'object' && (
                 <div className={`mb-8 p-6 ${style.introBg} border-2 ${style.introBorder} rounded-xl shadow-sm`}>
                    <h2 className={`text-2xl font-bold ${style.introTitle}`}>{intro.title}</h2>
                    <p className="mt-2 text-gray-700 leading-relaxed">{intro.description}</p>
                    {intro.script && (
                        <div className={`mt-4 p-4 ${style.scriptBg} border ${style.scriptBorder} rounded-lg`}>
                            <p className="text-gray-800">
                                <span className="font-bold">{intro.script.title}</span> "{intro.script.main}"
                            </p>
                            <p className="mt-2 text-sm text-gray-600">{intro.script.alternative}</p>
                        </div>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(subcategories).map(subcatId => {
                    const subcat = subcategories[subcatId];
                    return (
                        <button
                            key={subcatId}
                            onClick={() => onNavigate(View.Details, categoryId, subcatId)}
                            className={`subcategory-btn text-left p-6 ${style.gradient} rounded-xl shadow-sm w-full transition-transform transform hover:-translate-y-1 hover:shadow-lg`}
                        >
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h3 className={`text-lg font-semibold ${style.text}`}>{subcat.title}</h3>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SubMenuView;
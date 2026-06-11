import React from 'react';

const DailyIcon = () => (
    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const WeeklyIcon = () => (
    <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21V5a2 2 0 00-2-2H5a2 2 0 00-2 2v16m18 0h-2.25m-13.5 0H3M15 5.25v3.75m-6-3.75v3.75m-3.75 0h15.5" />
    </svg>
);

const NoteIcon = () => (
     <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);


const DutiesView: React.FC<{ data: any[] }> = ({ data }) => {
    if (!data) return null;

    return (
        <div className="space-y-6">
            {data.map((section, index) => {
                if (section.type === 'daily' || section.type === 'weekly') {
                    return (
                        <div key={index} className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                                {section.type === 'daily' ? <DailyIcon /> : <WeeklyIcon />}
                                <h3 className="text-2xl font-bold text-purple-800">{section.title}</h3>
                            </div>
                            <ol className="list-decimal list-inside space-y-3 text-gray-700">
                                {section.items.map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ol>
                        </div>
                    );
                }
                if (section.type === 'note') {
                    return (
                        <div key={index} className="bg-purple-100 border-l-4 border-purple-500 rounded-r-lg p-6 flex items-start">
                           <NoteIcon />
                           <div>
                                <h4 className="font-bold text-purple-900">{section.title}</h4>
                                <p className="text-purple-800 mt-1">{section.content}</p>
                           </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default DutiesView;

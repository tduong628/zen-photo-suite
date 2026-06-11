import React from 'react';

const CheckIcon = () => (
    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mr-4 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const renderContentItem = (item: any, index: number) => {
    // Note: dangerouslySetInnerHTML is used here only to render simple <strong> tags from a trusted source (constants.ts)
    // to avoid over-complicating the JSON data structure.
    if (item.type === 'item') {
        return (
            <li key={index} className="flex items-start">
                <CheckIcon />
                <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
            </li>
        );
    }
    if (item.type === 'section') {
        return (
            <li key={index} className="flex items-start">
                <CheckIcon />
                <div>
                    <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.title }}></p>
                    <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600">
                        {item.items.map((subItem: string, subIndex: number) => (
                            <li key={subIndex} dangerouslySetInnerHTML={{ __html: subItem }}></li>
                        ))}
                    </ul>
                </div>
            </li>
        );
    }
    return null;
}

const WalkInDetailsView: React.FC<{ data: any }> = ({ data }) => {
    if (!data || !data.content) return null;
    return (
        <div className="bg-white p-6 md:p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-green-800 mb-6 pb-3 border-b-2 border-green-200">{data.title}</h2>
            <ul className="space-y-5">
                {data.content.map(renderContentItem)}
            </ul>
        </div>
    );
};

export default WalkInDetailsView;

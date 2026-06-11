import React from 'react';

const CheckIcon = () => (
    <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
);

const InfoIcon = () => (
    <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TicketIcon = () => (
     <svg className="w-8 h-8 text-sky-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h5.25m0 0h5.25m-10.5 0h5.25m-5.25 0h5.25m-10.5 0h5.25m5.25-12h-5.25m5.25 0h5.25M12 3.75l-3.75 3.75L12 11.25l3.75-3.75L12 3.75zm0 0L8.25 7.5M12 3.75L15.75 7.5M3.75 9.75l3.75 3.75L11.25 9.75l-3.75-3.75L3.75 9.75zm0 0l3.75 3.75m-3.75-3.75l3.75-3.75m9 3.75l3.75 3.75L20.25 9.75l-3.75-3.75L16.5 9.75zm0 0l3.75 3.75m-3.75-3.75l3.75-3.75" />
    </svg>
);


interface PromotionDetailsViewProps {
    data: any;
    sessionPromos: any[];
}

const PromotionDetailsView: React.FC<PromotionDetailsViewProps> = ({ data, sessionPromos }) => {
    if (!data || !data.sections) return null;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center">{data.title}</h2>
            {data.sections.map((section: any, index: number) => {
                if (section.type === 'offers') {
                    return (
                        <div key={index} className="bg-sky-50/50 border border-sky-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-2xl font-bold text-sky-800 mb-2">{section.title}</h3>
                            <p className="text-gray-600 mb-6">{section.description}</p>
                            <div className="space-y-4">
                                {section.items.map((item: any, i: number) => (
                                    <div key={i} className="flex items-start bg-white p-4 rounded-lg border border-sky-100">
                                        <div className="flex-shrink-0 mr-4 pt-1"><TicketIcon /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{item.title}</h4>
                                            <p className="text-gray-600">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (section.type === 'membership') {
                     return (
                        <div key={index} className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-6 shadow-lg relative overflow-hidden">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-amber-800">{section.title}</h3>
                                    <p className="text-gray-600 mt-1">{section.description}</p>
                                </div>
                                 <div className="text-right ml-4 flex-shrink-0 bg-amber-500 text-white font-bold py-2 px-4 rounded-full shadow-md">
                                     {section.price}
                                 </div>
                             </div>
                            <div className="mt-6 space-y-3">
                                {section.benefits.map((benefit: any, i: number) => (
                                    <div key={i} className="flex items-start">
                                        <CheckIcon />
                                        <div>
                                            {typeof benefit === 'string' ? (
                                                <p className="text-gray-700">{benefit}</p>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-gray-800">{benefit.title}</p>
                                                    <ul className="list-disc pl-6 mt-1 space-y-1 text-gray-600">
                                                        {benefit.items.map((subItem: string, j: number) => <li key={j}>{subItem}</li>)}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                if (section.type === 'rules') {
                    return (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start">
                            <InfoIcon />
                            <div>
                                <h3 className="text-xl font-bold text-blue-800 mb-2">{section.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{section.content}</p>
                            </div>
                        </div>
                    )
                }
                return null;
            })}

             {sessionPromos.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b-2 border-indigo-500 text-gray-800">
                        New Promotions (Current Session)
                    </h2>
                    <ul className="space-y-4">
                        {sessionPromos.map((promo, index) => (
                            <li key={index} className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                <h3 className="font-bold text-indigo-800">{promo.name}</h3>
                                <p className="text-gray-600 mt-1">{promo.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PromotionDetailsView;

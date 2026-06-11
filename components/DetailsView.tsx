import React from 'react';
import { LanguagePack } from '../types';
import PromotionDetailsView from './PromotionDetailsView';
import WalkInDetailsView from './WalkInDetailsView';
import PhoneProtocolView from './PhoneProtocolView';
import DutiesView from './DutiesView';

interface DetailsViewProps {
    langPack: LanguagePack;
    categoryId: string;
    subcategoryId: string | null;
    sessionPromos: any[];
}

const DetailsView: React.FC<DetailsViewProps> = ({ langPack, categoryId, subcategoryId, sessionPromos }) => {
    let contentData;
    const categoryData = langPack.content[categoryId];

    if (subcategoryId && categoryData?.subcategories) {
        contentData = categoryData.subcategories[subcategoryId];
    } else {
        contentData = categoryData;
    }

    if (!contentData) {
        return <p>Content not found.</p>;
    }

    if (categoryId === 'promotion' && typeof contentData.content === 'object' && contentData.content !== null) {
        return <PromotionDetailsView data={contentData.content} sessionPromos={sessionPromos} />;
    }

    if (categoryId === 'walkin' && subcategoryId && typeof contentData.content === 'object' && contentData.content !== null) {
        return <WalkInDetailsView data={contentData} />;
    }

    if (categoryId === 'phone' && typeof contentData.content === 'object' && contentData.content !== null) {
        return <PhoneProtocolView data={contentData.content} />;
    }

    if (categoryId === 'duties' && typeof contentData.content === 'object' && contentData.content !== null) {
        return <DutiesView data={contentData.content} />;
    }

    // Fallback for other content that is still a string
    return (
        <div>
            <div dangerouslySetInnerHTML={{ __html: contentData.content || '' }} />
        </div>
    );
};

export default DetailsView;
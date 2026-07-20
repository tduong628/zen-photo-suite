
export enum View {
    MainMenu = 'MainMenu',
    Branding = 'Branding',
    Social = 'Social',
    Gallery = 'Gallery',
    Inbox = 'Inbox'
}

export type NotificationType = 'error' | 'success';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// New Types for Social Tool Upgrade
export interface ImageAnalysis {
    serviceType: string;
    colors: string[];
    mood: string;
    suggestedSeason: string;
}

export interface OmniSocialResult {
    instagram: string;
    facebook: string;
    tiktokScript: string;
    veoPrompts: {
        cinematic: string;
        motion: string;
        creative: string;
    };
    hooks: string[];
    comments: string[];
    hashtags: {
        niche: string[];
        local: string[];
        trending: string[];
    };
    viralityScore: number;
    improvementTip: string;
}

export interface LanguagePack {
    headerSubtitle: string;
    mainTitle: string;
    cat5Title: string; cat5Desc: string;
    cat6Title: string; cat6Desc: string;
    
    // Shared Errors
    errorApiRateLimit: string;
    errorApiGeneric: string;
    passwordError: string;
    passwordTitle: string;
    passwordPrompt: string;
    passwordPlaceholder: string;
    passwordSubmit: string;

    // Branding Tool
    brandToolTitle: string; brandToolDesc: string;
    brandToolUpload: string;
    brandToolOriginal: string; brandToolBranded: string;
    brandToolChooseTemplate: string; brandToolDownloadBtn: string;
    
    // Branding Categories
    brandCategoryClassic: string;
    brandCategoryVibrant: string;
    brandCategoryLifestyle: string;
    brandCategoryHoliday: string;
    brandCategoryModel: string;
    brandCategoryPortrait: string; // New Category

    // Templates
    templateStudioTitle: string; templateStudioDesc: string;
    templateSeasonalTitle: string; templateSeasonalDesc: string;
    templateLifestyleTitle: string; templateLifestyleDesc: string;
    templateVibrantTitle: string; templateVibrantDesc: string;
    templateMochaTitle: string; templateMochaDesc: string;
    templateSweaterTitle: string; templateSweaterDesc: string;
    templateNeutralsTitle: string; templateNeutralsDesc: string;
    templateGoldenHourTitle: string; templateGoldenHourDesc: string;
    templateHolidayTitle: string; templateHolidayDesc: string;

    // Golden Seasons (Expanded)
    templateGoldenSpringTitle: string;
    templateGoldenSummerTitle: string;
    templateGoldenFallTitle: string;
    templateGoldenWinterTitle: string;
    templateGoldenXmasTitle: string;
    templateGoldenNYTitle: string;

    // Model Templates
    templateModelUrbanTitle: string; templateModelUrbanDesc: string;
    templateModelLuxuryTitle: string; templateModelLuxuryDesc: string;
    templateModelSmartTitle: string; templateModelSmartDesc: string;
    
    // Portrait Templates (New)
    templatePortraitGlamTitle: string; templatePortraitGlamDesc: string;
    templatePortraitSoftTitle: string; templatePortraitSoftDesc: string;
    templatePortraitEdgyTitle: string; templatePortraitEdgyDesc: string;
    
    // Holidays
    holidayChristmas: string;
    holidayNewYear: string;
    holidayValentines: string;
    holidayHalloween: string;
    holidayThanksgiving: string;
    holidayMothersDay: string;

    // Social Tool (Redesigned)
    socialToolTitle: string; socialToolDesc: string;
    socialToolUpload: string;
    socialToolAnalyzeBtn: string;
    socialToolAnalyzing: string;
    socialToolAnalysisTitle: string;
    socialToolGenerateBtn: string;
    socialToolGenerating: string;
    socialTabInsta: string;
    socialTabFB: string;
    socialTabTikTok: string;
    socialSectionHooks: string;
    socialSectionComments: string;
    socialSectionHashtags: string;
    socialSectionScore: string;
    socialToolQ1: string;
    socialToolQ2: string;
    socialToolQ3: string;
    socialToolResultTitle: string;
    socialToolCopyBtn: string;
    
    // Social Tool Options
    socialToolToneLabel: string;
    socialToolToneProfessional: string;
    socialToolToneFriendly: string;
    socialToolTonePlayful: string;
    socialToolToneEmpathetic: string;
    socialToolToneUrgent: string;
    socialToolToneInformative: string;
    socialToolLengthLabel: string;
    socialToolLengthShort: string;
    socialToolLengthMedium: string;
    socialToolLengthDetailed: string;
    socialToolPlatformLabel: string;
    socialToolPlatformInstagram: string;
    socialToolPlatformFacebook: string;
    socialToolPlatformGoogle: string;

    // Promo Tool
    promoToolTitle: string; promoToolDesc: string;
    promoToolTitleLabel: string;
    promoToolOfferLabel: string;
    promoToolOffer2Label: string;
    promoToolNotesLabel: string;
    promoToolDatesLabel: string;
    promoToolKeywordsLabel: string;
    promoToolStyleLabel: string;
    promoToolGenerateBtn: string;
    promoToolResultTitle: string;
    promoToolDownloadBtn: string;
    promoStyleElegant: string;
    promoStyleModern: string;
    promoStyleSeasonal: string;
    promoStylePlayful: string;
    promoStyleLifestyle: string;
    promoStyleNatural: string;
    promoStyleSplit: string;

    // Idea Tool
    ideaToolTitle: string; ideaToolDesc: string;
    ideaToolInstantTitle: string; ideaToolInstantDesc: string;
    ideaToolDeepDiveTitle: string; ideaToolDeepDiveDesc: string;
    ideaToolChatbotTitle: string; ideaToolChatbotDesc: string;
    ideaToolBack: string; ideaToolNext: string; ideaToolSubmit: string;
    ideaToolResultTitle: string;
    ideaToolAddToPromoBtn: string;
    ideaToolCreateLandingPageBtn: string;
    ideaToolCreateGraphicBtn: string;
    ideaToolRestart: string;
    chatbotWelcomeMessage: string;
    chatbotInputPlaceholder: string;
    // Questionnaire
    q1Title: string; q1Prompt: string; q1o1: string; q1o2: string; q1o3: string; q1o4: string; q1o5: string;
    q2Title: string; q2Prompt: string; q2o1: string; q2o2: string; q2o3: string; q2o4: string;
    q3Title: string; q3Prompt: string; q3o1: string; q3o2: string; q3o3: string; q3o4: string;
    q3subPremium: string; q3sp1: string; q3sp2: string; q3sp3: string; q3sp4: string; q3sp5: string;
    q3subCombo: string; q3sc1: string; q3sc2: string; q3sc3: string; q3sc4: string; q3sc5: string; q3sc6: string;
    q4Title: string; q4Prompt: string; q4o1: string; q4o2: string; q4o3: string; q4o4: string;
    q5Title: string; q5Prompt: string; q5o1: string; q5o2: string; q5o3: string; q5o4: string;
    q6Title: string; q6Prompt: string; q6o1: string; q6o2: string; q6o3: string; q6o4: string; q6o5: string;
    q7Title: string; q7Prompt: string; q7Other: string;
    q8Title: string; q8Prompt: string; q8o1: string; q8o2: string; q8o3: string; q8o4: string;

    // Video Tool
    videoToolTitle: string; videoToolDesc: string;
    videoToolStyleLabel: string;
    videoToolFormatLabel: string;
    videoToolGenerateBtn: string;
    videoToolResultTitle: string;
    videoToolDownloadBtn: string;
    motionStyleZoom: string;
    motionStylePan: string;
    motionStyleSparkle: string;
    motionStylePetals: string;
    videoToolFormatRegular: string;
    videoToolFormatSquare: string;
    videoToolFormatReel: string;

    // Brochure Tool
    brochureToolTitle: string; brochureToolDesc: string;
    brochureToolHeadlineLabel: string;
    brochureToolSubheadlineLabel: string;
    brochureToolPriceLabel: string;
    brochureToolBlock1HeadlineLabel: string;
    brochureToolBlock1FeatureLabel: string;
    brochureToolBlock2HeadlineLabel: string;
    brochureToolBlock2FeatureLabel: string;
    brochureToolCallToActionLabel: string;
    brochureToolFooterLabel: string;
    brochureToolStyleLabel: string;
    brochureToolGenerateBtn: string;
    brochureToolResultTitle: string;
    brochureToolDownloadBtn: string;
    brochureStyleLuxury: string;
    brochureStyleTrendy: string;
    brochureStyleElegant: string;
    brochureStyleNatural: string;
    brochureStyleBold: string;
    brochureStyleModern: string;
    brochureStyleMinimal: string;
    brochureStyleProfessional: string;

    // Landing Page Tool
    landingPageToolTitle: string;
    landingPageToolDesc: string;
    landingPageSelectedPromos: string;
    landingPageToneLabel: string;
    landingPageLayoutLabel: string;
    landingPageGenerateBtn: string;
    landingPageToneProfessional: string;
    landingPageToneExciting: string;
    landingPageToneBenefit: string;
    landingPageLayoutSingle: string;
    landingPageLayoutImageLeft: string;
    landingPageLayoutImageRight: string;
    
    // Coach Tool
    coachTitle: string; coachDesc: string;
    coachStatusIdle: string; coachStatusConnecting: string;
    coachStatusListening: string; coachStatusSpeaking: string; coachStatusError: string;
    coachMicPermissionError: string;
    
    // Content structure support
    content: Record<string, any>;
}

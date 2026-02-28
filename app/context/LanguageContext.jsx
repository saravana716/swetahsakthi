import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

// Comprehensive translation dictionary
export const translations = {
  en: { 
    continue: "CONTINUE >", 
    skip: "Skip for now",
    splash: { title: "Swarna Sakhi", subtitle: "YOUR DIGITAL GOLD PARTNER" },
    get_started: { title: "Secure Your Wealth Digitally", subtitle: "Buy, Sell & save 24k Digital Gold instantly at live market prices." , btn: "GET STARTED", terms1: "By continuing, you agree to our ", terms2: "Terms & Conditions", terms3: " and ", terms4: "Privacy Policy." },
    login: { title: "Welcome to Swarna Sakhi", subtitle: "Enter your mobile number or email", mobilePlaceholder: "Mobile number", or: "or", emailLogin: "Login with Email", sendBtn: "SEND OTP", receiveUpdates: "Receive updates on WhatsApp", skipVerif: "Skip Verification" },
    create_vault: { title: "Create Your Vault", fullname: "Full Name", email: "Email Id", city: "City", refferal: "Have a referral code?", terms1: "By creating your vault, you explicitly agree to our ", terms2: "Terms & Conditions", terms3: " and ", terms4: "Privacy Policy." },
    referral: { haveCode: "Have a referral code?", subtitle: "Enter it below to get a bonus on your first purchase!", inputPlaceholder: "Enter Referral Code", applyBtn: "APPLY CODE", skipBtn: "Skip for now" },
    tabs: { home: "Home", portfolio: "Your Portfolio", scan: "Scan", orders: "Orders", account: "Account" },
    scanner: { scanPay: "Scan & Pay", buySell: "Buy & Sell", autoSave: "Auto Save", redeem: "Redeem" },
    dashboard: { hello: "HELLO", portfolio: "Your Portfolio", totalGold: "Total Digital Gold", totalSilver: "Total Digital Silver", invested: "INVESTED", profit: "PROFIT", rateLive: "LIVE RATES", viewAll: "View all", buy: "Buy", sell: "Sell", qa: "QUICK ACCESS", latestGold: "LATEST GOLD", latestSilver: "LATEST SILVER", referEarn: "REFER & EARN", transaction: "TRANSACTION", vaultpay: "VAULTPAY", insights: "Market Insights", selectLanguage: "Select Language", close: "Close" },
    portfolio: { title: "My Assets", currentValue: "Current Portfolio Value", invested: "Invested", totalReturns: "Total Returns", performance: "Performance", yourVault: "Your Vault", realGold: "Real Gold Jewellery", realGoldSub: "Exchange digital gold for physical art.", viewAll: "View all", pure24k: "24K Pure", purity: "99.9% Purity", augmont: "Augmont Secured", silver: "Silver", insuredVault: "Insured Vault", share: "Share" },
    orders: { title: "Orders", all: "all", buy: "Buy", sell: "Sell", sip: "SIP", failed: "failed", boughtGold: "Bought Gold", soldGold: "Sold Gold", monthlySIP: "Monthly SIP", boughtSilver: "Bought Silver", referralBonus: "Referral Bonus", paymentFailed: "Payment Failed", searchPlaceholder: "Search orders..." },
    account: { title: "Account", subtitle: "Manage your profile & preferences", kycVerified: "KYC Verified", history: "HISTORY", wealth: "WEALTH", tenure: "TENURE", settings: "SETTINGS", personalInfo: "Personal Information", personalInfoSub: "Name, Email, Phone", notifications: "Notifications", notificationsSub: "Active", security: "Security & Privacy", securitySub: "Password, Biometric", appearance: "Appearance", appearanceSub: "Light Mode", help: "Help & Support", helpSub: "FAQs, Chat", logout: "Log Out", editProfile: "Edit Profile", fullName: "Full Name", email: "Email", saveChanges: "Save Changes", lightMode: "Light Mode", darkMode: "Dark Mode" },
    notifications: { title: "Notifications", empty: "No notifications yet", emptySub: "Stay tuned for updates on your vault and gold prices.", markRead: "Mark all as read", settings: "Notification Settings", promo: "Promotions & Offers", alert: "Price Alerts", order: "Order Updates", active: "Active", inactive: "Inactive" }
  },
  hi: { 
    continue: "आगे बढ़ें >", 
    skip: "अभी छोड़ें",
    splash: { title: "स्वर्ण सखी", subtitle: "आपका डिजिटल गोल्ड पार्टनर" },
    get_started: { title: "अपनी संपत्ति को सुरक्षित करें", subtitle: "लाइव बाजार कीमतों पर तुरंत 24K डिजिटल गोल्ड खरीदें, बेचे और बचाएं।", btn: "शुरू करें", terms1: "जारी रखकर, आप हमारी ", terms2: "नियम एवं शर्तों", terms3: " और ", terms4: "गोपनीयता नीति से सहमत हैं।" },
    login: { title: "स्वर्ण सखी में आपका स्वागत है", subtitle: "अपना मोबाइल नंबर या ईमेल दर्ज करें", mobilePlaceholder: "मोबाइल नंबर", or: "या", emailLogin: "ईमेल से लॉगिन करें", sendBtn: "ओटीपी भेजें", receiveUpdates: "WhatsApp पर अपडेट प्राप्त करें", skipVerif: "सत्यापन छोड़ें" },
    create_vault: { title: "अपना वॉल्ट बनाएं", fullname: "पूरा नाम", email: "ईमेल आईडी", city: "शहर", refferal: "क्या आपके पास रेफरल कोड है?", terms1: "अपना वॉल्ट बनाकर, आप हमारी ", terms2: "नियम एवं शर्तों", terms3: " और ", terms4: "गोपनीयता नीति से सहमत हैं।" },
    referral: { haveCode: "क्या आपके पास रेफरल कोड है?", subtitle: "अपनी पहली खरीदारी पर बोनस पाने के लिए इसे नीचे दर्ज करें!", inputPlaceholder: "रेफरल कोड दर्ज करें", applyBtn: "कोड लागू करें", skipBtn: "अभी छोड़ें" },
    tabs: { home: "होम", portfolio: "आपका पोर्टफोलियो", scan: "स्कैन", orders: "ऑर्डर", account: "खाता" },
    scanner: { scanPay: "स्कैन और पे", buySell: "खरीदें और बेचें", autoSave: "ऑटो सेव", redeem: "रिडीम" },
    dashboard: { hello: "नमस्ते", portfolio: "आपका पोर्टफोलियो", totalGold: "कुल डिजिटल गोल्ड", totalSilver: "कुल डिजिटल सिल्वर", invested: "निवेश", profit: "लाभ", rateLive: "लाइव दरें", viewAll: "सभी देखें", buy: "खरीदें", sell: "बेचें", qa: "त्वरित पहुंच", latestGold: "नवीनतम गोल्ड", latestSilver: "नवीनतम सिल्वर", referEarn: "रेफर करें और कमाएं", transaction: "लेनदेन", vaultpay: "वॉल्टपे", insights: "बाजार की जानकारी", selectLanguage: "भाषा चुनें", close: "बंद करें" },
    portfolio: { title: "मेरी संपत्ति", currentValue: "वर्तमान पोर्टफोलियो मूल्य", invested: "निवेश", totalReturns: "कुल रिटर्न", performance: "प्रदर्शन", yourVault: "आपका वॉल्ट", realGold: "असली सोने के आभूषण", realGoldSub: "डिजिटल सोने को भौतिक कला में बदलें।", viewAll: "सभी देखें", pure24k: "24K शुद्ध", purity: "99.9% शुद्धता", augmont: "ऑगमॉन्ट सुरक्षित", silver: "चांदी", insuredVault: "बीमित वॉल्ट", share: "साझा करें" },
    orders: { title: "ऑर्डर", all: "सभी", buy: "खरीदें", sell: "बेचें", sip: "SIP", failed: "विफल", boughtGold: "सोना खरीदा", soldGold: "सोना बेचा", monthlySIP: "मासिक SIP", boughtSilver: "चांदी खरीदी", referralBonus: "रेफरल बोनस", paymentFailed: "भुगतान विफल", searchPlaceholder: "ऑर्डर खोजें..." },
    account: { title: "खाता", subtitle: "अपनी प्रोफ़ाइल और प्राथमिकताएं प्रबंधित करें", kycVerified: "KYC सत्यापित", history: "इतिहास", wealth: "धन", tenure: "कार्यकाल", settings: "सेटिंग्स", personalInfo: "व्यक्तिगत जानकारी", personalInfoSub: "नाम, ईमेल, फोन", notifications: "सूचनाएं", notificationsSub: "सक्रिय", security: "सुरक्षा और गोपनीयता", securitySub: "पासवर्ड, बायोमेट्रिक", appearance: "दिखावट", appearanceSub: "लाइट मोड", help: "सहायता और समर्थन", helpSub: "FAQs, चैट", logout: "लॉग आउट", editProfile: "प्रोफ़ाइल संपादित करें", fullName: "पूరా नाम", email: "ईमेल", saveChanges: "परिवर्तन सहेजें", lightMode: "लाइट मोड", darkMode: "डार्क मोड" },
    notifications: { title: "सूचनाएं", empty: "अभी तक कोई सूचना नहीं", emptySub: "अपने वॉल्ट और सोने की कीमतों पर अपडेट के लिए बने रहें।", markRead: "सभी को पढ़े के रूप में चिह्नित करें", settings: "सूचनाएं सेटिंग्स", promo: "प्रचार और ऑफ़र", alert: "मूल्य अलर्ट", order: "ऑर्डर अपडेट", active: "सक्रिय", inactive: "निष्क्रिय" }
  },
  ta: { 
    continue: "தொடரவும் >", 
    skip: "தவிர்க்கவும்",
    splash: { title: "ஸ்வர்ண சகி", subtitle: "உங்கள் டிஜிட்டல் தங்கம் கூட்டாளர்" },
    get_started: { title: "உங்கள் செல்வத்தைப் பாதுகாக்கவும்", subtitle: "நேரடி சந்தை விலையில் உடனடியாக 24K டிஜிட்டல் தங்கத்தை வாங்கவும், விற்கவும் மற்றும் சேமிக்கவும்.", btn: "தொடங்குங்கள்", terms1: "தொடர்வதன் மூலம், எங்கள் ", terms2: "விதிமுறைகள்", terms3: " மற்றும் ", terms4: "தனியுரிமைக் கொள்கையை ஏற்கிறீர்கள்." },
    login: { title: "ஸ்வர்ண சகிக்கு வரவேற்கிறோம்", subtitle: "உங்கள் மொபைல் எண் அல்லது மின்னஞ்சலை உள்ளிடவும்", mobilePlaceholder: "மொபைல் எண்", or: "அல்லது", emailLogin: "மின்னஞ்சல் மூலம் உள்நுழையவும்", sendBtn: "ஓடிபியை அனுப்பு", receiveUpdates: "WhatsApp மூலம் அறிவிப்புகளைப் பெறுங்கள்", skipVerif: "சரிபார்ப்பைத் தவிர்" },
    create_vault: { title: "உங்கள் பெட்டகத்தை உருவாக்கவும்", fullname: "முழு பெயர்", email: "மின்னஞ்சல் முகவரி", city: "நகரம்", refferal: "பரிந்துரை குறியீடு உள்ளதா?", terms1: "உங்கள் பெட்டகத்தை உருவாக்குவதன் மூலம், எங்கள் ", terms2: "விதிமுறைகள்", terms3: " மற்றும் ", terms4: "தனியுரிமைக் கொள்கையை ஏற்கிறீர்கள்." },
    referral: { haveCode: "பரிந்துரை குறியீடு உள்ளதா?", subtitle: "உங்கள் முதல் வாங்குதலில் போனஸ் பெற அதை கீழே உள்ளிடவும்!", inputPlaceholder: "பரிந்துரை குறியீட்டை உள்ளிடவும்", applyBtn: "குறியீட்டை பயன்படுத்து", skipBtn: "தவிர்க்கவும்" },
    tabs: { home: "முகப்பு", portfolio: "போர்ட்ஃபோலியோ", scan: "ஸ்கேன்", orders: "ஆர்டர்கள்", account: "கணக்கு" },
    scanner: { scanPay: "ஸ்கேன் & பே", buySell: "வாங்க & விற்க", autoSave: "ஆட்டோ சேவ்", redeem: "மீட்பு" },
    dashboard: { hello: "வணக்கம்", portfolio: "போர்ட்ஃபோலியோ", totalGold: "மொத்த டிஜிட்டல் தங்கம்", totalSilver: "மொத்த டிஜிட்டல் வெள்ளி", invested: "முதலீடு", profit: "லாபம்", rateLive: "நேரடி விலைகள்", viewAll: "அனைத்தையும் காண்", buy: "வாங்க", sell: "விற்க", qa: "விரைவு அணுகல்", latestGold: "சமீபத்திய தங்கம்", latestSilver: "சமீபத்திய வெள்ளி", referEarn: "பரிந்துரைத்து சம்பாதிக்கவும்", transaction: "பரிவர்த்தனை", vaultpay: "வால்ட்பே", insights: "சந்தை நுண்ணறிவு", selectLanguage: "மொழியைத் தேர்ந்தெடு", close: "மூடு" },
    portfolio: { title: "என் சொத்துகள்", currentValue: "போர்ட்ஃபோலியோ மதிப்பு", invested: "முதலீடு", totalReturns: "மொத்த வருமானம்", performance: "செயல்திறன்", yourVault: "உங்கள் பெட்டகம்", realGold: "உண்மையான தங்க நகைகள்", realGoldSub: "டிஜிட்டல் தங்கத்தை கலைப் பொருளாக மாற்றுங்கள்.", viewAll: "அனைத்தையும் காண்", pure24k: "24K தூய்மை", purity: "99.9% தூய்மை", augmont: "Augmont பாதுகாக்கப்பட்டது", silver: "வெள்ளி", insuredVault: "காப்பீடு செய்யப்பட்ட பெட்டகம்", share: "பகிர்" },
    orders: { title: "ஆர்டர்கள்", all: "அனைத்தும்", buy: "வாங்க", sell: "விற்க", sip: "SIP", failed: "தோல்வி", boughtGold: "தங்கம் வாங்கப்பட்டது", soldGold: "தங்கம் விற்கப்பட்டது", monthlySIP: "மாதாந்திர SIP", boughtSilver: "வெள்ளி வாங்கப்பட்டது", referralBonus: "பரிந்துரை போனஸ்", paymentFailed: "பணம் செலுத்துதல் தோல்வி", searchPlaceholder: "ஆர்டர்களைத் தேடுங்கள்..." },
    account: { title: "கணக்கு", subtitle: "உங்கள் சுயவிவரம் மற்றும் விருப்பங்களை நிர்வகிக்கவும்", kycVerified: "KYC சரிபார்க்கப்பட்டது", history: "வரலாறு", wealth: "செல்வம்", tenure: "காலாவதி", settings: "அமைப்புகள்", personalInfo: "தனிப்பட்ட தகவல்", personalInfoSub: "பெயர், மின்னஞ்சல், தொலைபேசி", notifications: "அறிவிப்புகள்", notificationsSub: "செயலில் உள்ளது", security: "பாதுகாப்பு & தனியுரிமை", securitySub: "கடவுச்சொல், பயோமெட்ரிக்", appearance: "தோற்றம்", appearanceSub: "ஒளி பயன்முறை", help: "உதவி & ஆதரவு", helpSub: "கேள்விகள், அரட்டை", logout: "வெளியேறு", editProfile: "சுயவிவரத்தைத் திருத்து", fullName: "முழு பெயர்", email: "மின்னஞ்சல்", saveChanges: "மாற்றங்களைச் சேமி", lightMode: "ஒளி பயன்முறை", darkMode: "இருண்ட பயன்முறை" },
    notifications: { title: "அறிவிப்புகள்", empty: "இன்னும் அறிவிப்புகள் இல்லை", emptySub: "உங்கள் பெட்டகம் மற்றும் தங்க விலைகள் குறித்த அறிவிப்புகளுக்காக காத்திருங்கள்.", markRead: "அனைத்தையும் படித்ததாகக் குறிக்கவும்", settings: "அறிவிப்பு அமைப்புகள்", promo: "விளம்பரங்கள் & சலுகைகள்", alert: "விலை எச்சரிக்கைகள்", order: "ஆர்டர் அறிவிப்புகள்", active: "செயலில் உள்ளது", inactive: "செயலற்றது" }
  },
  te: { 
    continue: "కొనసాగించు >", 
    skip: "దాటవేయి",
    splash: { title: "స్వర్ణ సఖి", subtitle: "మీ డిజిటల్ గోల్డ్ భాగస్వామి" },
    get_started: { title: "మీ సంపదను సురక్షితంగా ఉంచుకోండి", subtitle: "లైవ్ మార్కెట్ ధర వద్ద తక్షణమే 24K డిజిటల్ బంగారాన్ని కొనండి, అమ్మండి మరియు ఆదా చేయండి.", btn: "ప్రారంభించండి", terms1: "కొనసాగించడం ద్వారా, మా ", terms2: "నిబంధనలు", terms3: " మరియు ", terms4: "గోప్యతా విధానాన్ని అంగీకరిస్తున్నారు." },
    login: { title: "స్వర్ణ సఖికి స్వాగతం", subtitle: "మీ మొబైల్ నంబర్ లేదా ఇమెయిల్‌ను నమోదు చేయండి", mobilePlaceholder: "మొబైల్ నంబర్", or: "లేదా", emailLogin: "ఇమెయిల్‌తో లాగిన్ చేయండి", sendBtn: "OTP పంపండి", receiveUpdates: "WhatsApp లో అప్‌డేట్‌లను పొందండి", skipVerif: "ధృవీకరణను దాటవేయి" },
    create_vault: { title: "మీ వాల్ట్‌ను సృష్టించండి", fullname: "పూర్తి పేరు", email: "ఇమెయిల్ ID", city: "నగరం", refferal: "రెఫరల్ కోడ్ ఉందా?", terms1: "మీ వాల్ట్‌ను సృష్టించడం ద్వారా, మా ", terms2: "నిబంధనలు", terms3: " మరియు ", terms4: "గోప్యతా విధానాన్ని అంగీకరిస్తున్నారు." },
    referral: { haveCode: "రెఫరల్ కోడ్ ఉందా?", subtitle: "మీ మొదటి కోనుగోలుపై బోనస్ పొందడానికి దాన్ని క్రింద నమోదు చేయండి!", inputPlaceholder: "రెఫరల్ కోడ్ నమోదు చేయండి", applyBtn: "కోడ్ వర్తించు", skipBtn: "దాటవేయి" },
    tabs: { home: "హోమ్", portfolio: "మీ పోర్ట్‌ఫోలియో", scan: "స్కాన్", orders: "ఆర్డర్‌లు", account: "ఖాతా" },
    scanner: { scanPay: "స్కాన్ & పే", buySell: "కొనుగోలు & అమ్మకం", autoSave: "ఆటో సేవ్", redeem: "రీడీమ్" },
    dashboard: { hello: "హలో", portfolio: "మీ పోర్ట్‌ఫోలియో", totalGold: "మొత్తం డిజిటల్ బంగారం", totalSilver: "మొత్తం డిజిటల్ వెండి", invested: "పెట్టుబడి", profit: "లాభం", rateLive: "లైవ్ రేట్లు", viewAll: "అన్నీ చూడండి", buy: "కొనుగోలు", sell: "అమ్మకం", qa: "శీఘ్ర యాక్సెస్", latestGold: "తాజా బంగారం", latestSilver: "తాజా వెండి", referEarn: "రెఫర్ & సంపాదించండి", transaction: "లావాదేవీ", vaultpay: "వాల్ట్‌పే", insights: "మార్కెట్ అంతర్దృష్టులు", selectLanguage: "భాష ఎంచుకోండి", close: "మూసివేయి" },
    portfolio: { title: "నా ఆస్తులు", currentValue: "ప్రస్తుత పోర్ట్‌ఫోలియో విలువ", invested: "పెట్టుబడి", totalReturns: "మొత్తం రిటర్న్‌లు", performance: "పనితీరు", yourVault: "మీ వాల్ట్", realGold: "నిజమైన బంగారు నగలు", realGoldSub: "డిజితల్ బంగారాన్ని భౌతిక కళగా మార్చండి.", viewAll: "అన్నీ చూడండి", pure24k: "24K స్వచ్ఛమైనది", purity: "99.9% స్వచ్ఛత", augmont: "Augmont భద్రత", silver: "వెండి", insuredVault: "భద్రపరచిన వాల్ట్", share: "పంచుకోండి" },
    orders: { title: "ఆర్డర్‌లు", all: "అన్నీ", buy: "కొనుగోలు", sell: "అమ్మకం", sip: "SIP", failed: "విఫలమైంది", boughtGold: "బంగారం కొనుగోలు చేసారు", soldGold: "బంగారం అమ్మారు", monthlySIP: "నెలవారీ SIP", boughtSilver: "వెండి కొనుగోలు చేసారు", referralBonus: "రెఫరల్ బోనస్", paymentFailed: "చెల్లింపు విఫలమైంది", searchPlaceholder: "ఆర్డర్‌లను శోధించండి..." },
    account: { title: "ఖాతా", subtitle: "మీ ప్రొఫైల్ & ప్రాధాన్యతలను నిర్వహించండి", kycVerified: "KYC ధృవీకరించబడింది", history: "చరిత్ర", wealth: "సంపద", tenure: "పదవీకాలం", settings: "సెట్టింగులు", personalInfo: "వ్యక్తిగత సమాచారం", personalInfoSub: "పేరు, ఇమెయిల్, ఫోన్", notifications: "నోటిఫికేషన్లు", notificationsSub: "క్రియాశీలకంగా ఉంది", security: "భద్రత & గోప్యత", securitySub: "పాస్వర్డ్, బయోమెట్రిక్", appearance: "ప్రదర్శన", appearanceSub: "లైట్ మోడ్", help: "సహాయం & మద్దతు", helpSub: "FAQs, చాట్", logout: "లాగ్ అవుట్", editProfile: "ప్రొఫైల్‌ను సవరించండి", fullName: "పూర్తి పేరు", email: "ఈమెయిల్", saveChanges: "మార్పులను సేవ్ చేయండి", lightMode: "లైట్ మోడ్", darkMode: "డార్క్ మోడ్" },
    notifications: { title: "నోటిఫికేషన్లు", empty: "ఇంకా నోటిఫికేషన్లు లేవు", emptySub: "మీ వాల్ట్ మరియు బంగారు ధరల అప్‌డేట్‌ల కోసం చూస్తూ ఉండండి.", markRead: "అన్నీ చదివినట్లుగా గుర్తించండి", settings: "నోటిఫికేషన్ సెట్టింగులు", promo: "ప్రమోషన్లు & ఆఫర్లు", alert: "ధర హెచ్చరికలు", order: "ఆర్డర్ అప్‌డేట్‌లు", active: "క్రియాశీలకంగా ఉంది", inactive: "క్రియాశీలం కాదు" }
  },
  kn: { 
    continue: "ಮುಂದುವರಿಸಿ >", 
    skip: "ಸ್ಕಿಪ್ ಮಾಡಿ",
    splash: { title: "ಸ್ವರ್ಣ ಸಖಿ", subtitle: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಚಿನ್ನದ ಪಾಲುದಾರ" },
    get_started: { title: "ನಿಮ್ಮ ಸಂಪತ್ತನ್ನು ಭದ್ರಪಡಿಸಿ", subtitle: "ಲೈವ್ ಮಾರ್ಕೆಟ್ ಬೆಲೆಯಲ್ಲಿ ತಕ್ಷಣ 24K ಡಿಜಿಟಲ್ ಚಿನ್ನವನ್ನು ಖರೀದಿಸಿ, ಮಾರಾಟ ಮಾಡಿ ಮತ್ತು ಉಳಿಸಿ.", btn: "ಪ್ರಾರಂಭಿಸಿ", terms1: "ಮುಂದುವರಿಸುವ ಮೂಲಕ, ನಮ್ಮ ", terms2: "ನಿಯಮಗಳು", terms3: " ಮತ್ತು ", terms4: "ಗೌಪ್ಯತೆ ನೀತಿಯನ್ನು ಒಪ್ಪಿದ್ದೀರಿ." },
    login: { title: "ಸ್ವರ್ಣ ಸಖಿಗೆ ಸ್ವಾಗತ", subtitle: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ನಮೂದಿಸಿ", mobilePlaceholder: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", or: "ಅಥವಾ", emailLogin: "ಇಮೇಲ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ", sendBtn: "OTP ಕಳುಹಿಸಿ", receiveUpdates: "WhatsApp ನಲ್ಲಿ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ", skipVerif: "ಪರಿಶೀಲನೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಿ" },
    create_vault: { title: "ನಿಮ್ಮ ವಾಲ್ಟ್ ರಚಿಸಿ", fullname: "ಪೂರ್ಣ ಹೆಸರು", email: "ಇಮೇಲ್ ಐಡಿ", city: "ನಗರ", refferal: "ರೆಫರಲ್ ಕೋಡ್ ಇದೆಯೇ?", terms1: "ನಿಮ್ಮ ವಾಲ್ಟ್ ರಚಿಸುವ ಮೂಲಕ, ನಮ್ಮ ", terms2: "ನಿಯಮಗಳು", terms3: " ಮತ್ತು ", terms4: "ಗೌಪ್ಯತೆ ನೀತಿಯನ್ನು ಒಪ್ಪಿದ್ದೀರಿ." },
    referral: { haveCode: "ರೆಫರಲ್ ಕೋಡ್ ಇದೆಯೇ?", subtitle: "ನಿಮ್ಮ ಮೊದಲ ಖರೀದಿಯಲ್ಲಿ ಬೋನಸ್ ಪಡೆಯಲು ಅದನ್ನು ಕೆಳಗೆ ನಮೂದಿಸಿ!", inputPlaceholder: "ರೆಫರಲ್ ಕೋಡ್ ನಮೂದಿಸಿ", applyBtn: "ಕೋಡ್ ಅನ್ವಯಿಸಿ", skipBtn: "ಸ್ಕಿಪ್ ಮಾಡಿ" },
    tabs: { home: "ಮುಖಪುಟ", portfolio: "ನಿಮ್ಮ ಪೋರ್ಟ್ಫೋಲಿಯೊ", scan: "ಸ್ಕ್ಯಾನ್", orders: "ಆದೇಶಗಳು", account: "ಖಾತೆ" },
    scanner: { scanPay: "ಸ್ಕ್ಯಾನ್ & ಪೇ", buySell: "ಖರೀದಿಸಿ & ಮಾರಿ", autoSave: "ಆಟೋ ಸೇವ್", redeem: "ರಿಡೀಮ್" },
    dashboard: { hello: "ಹಲೋ", portfolio: "ನಿಮ್ಮ ಪೋರ್ಟ್ಫೋಲಿಯೊ", totalGold: "ಒಟ್ಟು ಡಿಜಿಟಲ್ ಚಿನ್ನ", totalSilver: "ಒಟ್ಟು ಡಿಜಿಟಲ್ ಬೆಳ್ಳಿ", invested: "ಹೂಡಿಕೆ ಮಾಡಲಾಗಿದೆ", profit: "ಲಾಭ", rateLive: "ಲೈವ್ ದರಗಳು", viewAll: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ", buy: "ಖರೀದಿಸಿ", sell: "ಮಾರಿ", qa: "ತ್ವರಿತ ಪ್ರವೇಶ", latestGold: "ಇತ್ತೀಚಿನ ಚಿನ್ನ", latestSilver: "ಇತ್ತೀಚಿನ ಬೆಳ್ಳಿ", referEarn: "ಉಲ್ಲೇಖಿಸಿ & ಗಳಿಸಿ", transaction: "ವಹಿವಾಟು", vaultpay: "ವಾಲ್ಟ್‌ಪೇ", insights: "ಮಾರುಕಟ್ಟೆ ಒಳನೋಟಗಳು", selectLanguage: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ", close: "ಮುಚ್ಚಿ" },
    portfolio: { title: "ನನ್ನ ಆಸ್ತಿಗಳು", currentValue: "ಪ್ರಸ್ತುತ ಪೋರ್ಟ್ಫೋಲಿಯೊ ಮೌಲ್ಯ", invested: "ಹೂಡಿಕೆ", totalReturns: "ಒಟ್ಟು ಆದಾಯ", performance: "ಕಾರ್ಯಕ್ಷಮತೆ", yourVault: "ನಿಮ್ಮ ವಾಲ್ಟ್", realGold: "ನಿಜವಾದ ಚಿನ್ನದ ಆಭರಣ", realGoldSub: "ಡಿಜಿಟಲ್ ಚಿನ್ನವನ್ನು ಭೌತಿಕ ಕಲೆಯಾಗಿ ಪರಿವರ್ತಿಸಿ.", viewAll: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ", pure24k: "24K ಶುದ್ಧ", purity: "99.9% ಶುದ್ಧತೆ", augmont: "Augmont ಸುರಕ್ಷಿತ", silver: "ಬೆಳ್ಳಿ", insuredVault: "ವಿಮಾ ವಾಲ್ಟ್", share: "ಹಂಚಿಕೊಳ್ಳಿ" },
    orders: { title: "ಆದೇಶಗಳು", all: "ಎಲ್ಲಾ", buy: "ಖರೀದಿಸಿ", sell: "ಮಾರಿ", sip: "SIP", failed: "ವಿಫಲವಾಗಿದೆ", boughtGold: "ಚಿನ್ನ ಖರೀದಿಸಲಾಗಿದೆ", soldGold: "ಚಿನ್ನ ಮಾರಾಟವಾಗಿದೆ", monthlySIP: "ಮಾಸಿಕ SIP", boughtSilver: "ಬೆಳ್ಳಿ ಖರೀದಿಸಲಾಗಿದೆ", referralBonus: "ರೆಫರಲ್ ಬೋನಸ್", paymentFailed: "ಪಾವತಿ ವಿಫಲವಾಗಿದೆ", searchPlaceholder: "ಆದೇಶಗಳನ್ನು ಹುಡುಕಿ..." },
    account: { title: "ಖಾತೆ", subtitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ", kycVerified: "KYC ಪರಿಶೀಲಿಸಲಾಗಿದೆ", history: "ಇತಿಹಾಸ", wealth: "ಸಂಪತ್ತು", tenure: "ಅವಧಿ", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", personalInfo: "ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ", personalInfoSub: "ಹೆಸರು, ಇಮೇಲ್, ಫೋನ್", notifications: "ಅಧಿಸೂಚನೆಗಳು", notificationsSub: "ಸಕ್ರಿಯವಾಗಿದೆ", security: "ಭದ್ರತೆ ಮತ್ತು ಗೌಪ್ಯತೆ", securitySub: "ಪಾಸ್‌ವರ್ಡ್, ಬಯೋಮೆಟ್ರಿಕ್", appearance: "ಗೋಚರತೆ", appearanceSub: "ಲೈಟ್ ಮೋಡ್", help: "ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ", helpSub: "FAQs, ಚಾಟ್", logout: "ಲಾಗ್ ಔಟ್", editProfile: "ಪ್ರೊಫೈಲ್ ಬದಲಾಯಿಸಿ", fullName: "ಪೂರ್ಣ ಹೆಸರು", email: "ಇಮೇಲ್", saveChanges: "ಬದಲಾವಣೆ ಉಳಿಸಿ", lightMode: "ಲೈಟ್ ಮೋಡ್", darkMode: "ಡಾರ್ಕ್ ಮೋಡ್" },
    notifications: { title: "ಅಧಿಸೂಚನೆಗಳು", empty: "ಇನ್ನೂ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ", emptySub: "ನಿಮ್ಮ ವಾಲ್ಟ್ ಮತ್ತು ಚಿನ್ನದ ಬೆಲೆಗಳ ನವೀಕರಣಗಳಿಗಾಗಿ ಕಾಯುತ್ತಿರಿ.", markRead: "ಎಲ್ಲವನ್ನೂ ಓದಿದಂತೆ ಗುರುತಿಸಿ", settings: "ಅಧಿಸೂಚನೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", promo: "ಪ್ರಚಾರಗಳು ಮತ್ತು ಕೊಡುಗೆಗಳು", alert: "ಬೆಲೆ ಎಚ್ಚರಿಕೆಗಳು", order: "ಆದೇಶದ ನವೀಕರಣಗಳು", active: "ಸಕ್ರಿಯವಾಗಿದೆ", inactive: "ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ" }
  },
  ml: { 
    continue: "തുടരുക >", 
    skip: "ഒഴിവാക്കുക",
    splash: { title: "സ്വർണ്ണ സഖി", subtitle: "നിങ്ങളുടെ ഡിജിറ്റൽ സ്വർണ്ണ പങ്കാളി" },
    get_started: { title: "നിങ്ങളുടെ സമ്പത്ത് സുരക്ഷിതമാക്കുക", subtitle: "തത്സമയ വിപണി വിലയിൽ തൽക്ഷണം 24K ഡിജിറ്റൽ സ്വർണ്ണം വാങ്ങുകയും വിൽക്കുകയും സംരക്ഷിക്കുകയും ചെയ്യുക.", btn: "തുടങ്ങുക", terms1: "തുടരുന്നതിലൂടെ, ഞങ്ങളുടെ ", terms2: "വ്യവസ്ഥകളും", terms3: " ", terms4: "സ്വകാര്യതാ നയവും നിങ്ങൾ അംഗീകരിക്കുന്നു." },
    login: { title: "സ്വർണ്ണ സഖിയിലേക്ക് സ്വാഗതം", subtitle: "നിങ്ങളുടെ മൊബൈൽ നമ്പറോ ഇമെയിലോ നൽകുക", mobilePlaceholder: "മൊബൈൽ നമ്പർ", or: "അല്ലെങ്കിൽ", emailLogin: "ഇമെയിൽ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യുക", sendBtn: "OTP അയയ്‌ക്കുക", receiveUpdates: "WhatsApp ൽ അപ്‌ഡേറ്റുകൾ നേടുക", skipVerif: "പരിശോധന ഒഴിവാക്കുക" },
    create_vault: { title: "നിങ്ങളുടെ വോൾട്ട് സൃഷ്ടിക്കുക", fullname: "പൂർണ്ണമായ പേര്", email: "ഇമെയിൽ ഐഡി", city: "നഗരം", refferal: "റഫറൽ കോഡ് ഉണ്ടോ?", terms1: "നിങ്ങളുടെ വോൾട്ട് സൃഷ്ടിക്കുന്നതിലൂടെ, ഞങ്ങളുടെ ", terms2: "വ്യവസ്ഥകളും", terms3: " ", terms4: "സ്വകാര്യതാ നയവും നിങ്ങൾ അംഗീകരിക്കുന്നു." },
    referral: { haveCode: "റഫറൽ കോഡ് ഉണ്ടോ?", subtitle: "നിങ്ങളുടെ ആദ്യ വാങ്ങലിൽ ബോണസ് ലഭിക്കുന്നതിന് താഴെ അത് നൽകുക!", inputPlaceholder: "റഫറൽ കോഡ് നൽകുക", applyBtn: "കോഡ് പ്രയോഗിക്കുക", skipBtn: "ഒഴിവാക്കുക" },
    tabs: { home: "ഹോം", portfolio: "നിങ്ങളുടെ പോർട്ട്ഫോളിയോ", scan: "സ്കാൻ", orders: "ഓർഡറുകൾ", account: "അക്കൗണ്ട്" },
    scanner: { scanPay: "സ്കാൻ & പേ", buySell: "വാങ്ങുക & വിൽക്കുക", autoSave: "ഓട്ടോ സേവ്", redeem: "റിഡീം" },
    dashboard: { hello: "ഹലോ", portfolio: "നിങ്ങളുടെ പോർട്ട്ഫോളിയോ", totalGold: "മൊത്തം ഡിജിറ്റൽ സ്വർണ്ണം", totalSilver: "മൊത്തം ഡിജിറ്റൽ വെള്ളി", invested: "നിക്ഷേപിച്ചു", profit: "ലാഭം", rateLive: "ലൈവ് നിരക്കുകൾ", viewAll: "എല്ലാം കാണുക", buy: "വാങ്ങുക", sell: "വിൽക്കുക", qa: "പെട്ടെന്നുള്ള ആക്സസ്", latestGold: "ഏറ്റവും പുതിയ സ്വർണ്ണം", latestSilver: "ഏറ്റവും പുതിയ വെള്ളി", referEarn: "റഫർ ചെയ്യുക & സമ്പാദിക്കുക", transaction: "ഇടപാട്", vaultpay: "വോൾട്ട്പേ", insights: "മാർക്കറ്റ് സ്ഥിതിവിവരക്കണക്കുകൾ", selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക", close: "അടയ്ക്കുക" },
    portfolio: { title: "എന്റെ ആസ്തികൾ", currentValue: "നിലവിലെ പോർട്ട്ഫോളിയോ മൂല്യം", invested: "നിക്ഷേപം", totalReturns: "മൊത്തം വരുമാനം", performance: "പ്രകടനം", yourVault: "നിങ്ങളുടെ വോൾട്ട്", realGold: "യഥാർത്ഥ സ്വർണ്ണ ആഭരണങ്ങൾ", realGoldSub: "ഡിജിറ്റൽ സ്വർണ്ണം ഭൗതിക കലയായി മാറ്റുക.", viewAll: "എല്ലാം കാണുക", pure24k: "24K ശുദ്ധം", purity: "99.9% സ്വർണ്ണ ശുദ്ധത", augmont: "Augmont സുരക്ഷിതം", silver: "വെള്ളി", insuredVault: "ഇൻഷ്വർ ചെയ്ത വോൾട്ട്", share: "പങ്കിടുക" },
    orders: { title: "ഓർഡറുകൾ", all: "എല്ലാം", buy: "വാങ്ങുക", sell: "വിൽക്കുക", sip: "SIP", failed: "പരാജയപ്പെട്ടു", boughtGold: "സ്വർണ്ണം വാങ്ങി", soldGold: "സ്വർണ്ണം വിറ്റു", monthlySIP: "പ്രതിമാസ SIP", boughtSilver: "വെള്ളി വാങ്ങി", referralBonus: "റഫറൽ ബോണസ്", paymentFailed: "പേയ്‌മെന്റ് പരാജയപ്പെട്ടു", searchPlaceholder: "ഓർഡറുകൾ തിരയുക..." },
    account: { title: "അക്കൗണ്ട്", subtitle: "നിങ്ങളുടെ പ്രൊഫൈലും മുൻഗണനകളും നിയന്ത്രിക്കുക", kycVerified: "KYC പരിശോധിച്ചു", history: "ചരിത്രം", wealth: "സമ്പത്ത്", tenure: "കാലാവധി", settings: "ക്രമീകരണങ്ങൾ", personalInfo: "വ്യക്തിഗത വിവരങ്ങൾ", personalInfoSub: "പേര്, ഇമെയിൽ, ഫോൺ", notifications: "അറിയിപ്പുകൾ", notificationsSub: "സജീവമാണ്", security: "സുരക്ഷ & സ്വകാര്യത", securitySub: "പാസ്‌വേഡ്, ബയോമെട്രിക്", appearance: "കാഴ്ച", appearanceSub: "ലൈറ്റ് മോഡ്", help: "സഹായം & പിന്തുണ", helpSub: "FAQs, ചാറ്റ്", logout: "ലോഗ് ഔട്ട്", editProfile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക", fullName: "പൂർണ്ണമായ പേര്", email: "ഇമെയിൽ", saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക", lightMode: "ലൈറ്റ് മോഡ്", darkMode: "ഡാർക്ക് മോഡ്" },
    notifications: { title: "അറിയിപ്പുകൾ", empty: "അറിയിപ്പുകൾ ഒന്നുമില്ല", emptySub: "നിങ്ങളുടെ വോൾട്ടിനെക്കുറിച്ചും സ്വർണ്ണ വിലയെക്കുറിച്ചുമുള്ള അറിയിപ്പുകൾക്കായി കാത്തിരിക്കുക.", markRead: "എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക", settings: "അറിയിപ്പ് ക്രമീകരണങ്ങൾ", promo: "പ്രമോഷനുകളും ഓഫറുകളും", alert: "വില അറിയിപ്പുകൾ", order: "ഓർഡർ അപ്‌ഡേറ്റുകൾ", active: "സജീവം", inactive: "നിഷ്ക്രിയം" }
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

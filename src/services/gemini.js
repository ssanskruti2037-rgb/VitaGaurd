/**
 * VitaGuard — Gemini AI Health Analysis Service
 * 
 * This module handles all communication with the Google Gemini API
 * for generating intelligent health risk assessments.
 * 
 * ALL analysis is 100% data-driven — no random numbers are used anywhere.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;

function getClient() {
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
        console.warn('⚠️ Gemini API key not configured. Using fallback analysis.');
        return null;
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }
    return genAI;
}

/**
 * Build the health analysis prompt from real user data for Gemini.
 * No random or mock data is included — everything comes from the user's input.
 */
function buildPrompt(formData) {
    const symptomsList = [...(formData.symptoms || [])];
    if (formData.otherSymptoms?.trim()) {
        symptomsList.push(formData.otherSymptoms.trim());
    }

    const symptoms = symptomsList.length > 0
        ? symptomsList.join(', ')
        : 'None reported';

    const sleepMap = {
        'less_5': 'Less than 5 hours',
        '5_7': '5-7 hours',
        '7_9': '7-9 hours',
        '9_plus': 'More than 9 hours'
    };

    const exerciseMap = {
        'never': 'Rarely or never',
        'sometimes': '1-2 days/week',
        'regular': '3-4 days/week',
        'daily': 'Daily'
    };

    const smokingMap = {
        'non': 'Non-smoker',
        'former': 'Former smoker',
        'occasional': 'Occasional smoker',
        'regular': 'Regular smoker'
    };

    const alcoholMap = {
        'none': 'None',
        'low': 'Occasional / Low',
        'moderate': 'Moderate',
        'high': 'High'
    };

    // Calculate BMI if height and weight are available
    let bmiInfo = 'Not calculable';
    if (formData.height && formData.weight) {
        const heightM = parseFloat(formData.height) / 100;
        const bmi = (parseFloat(formData.weight) / (heightM * heightM)).toFixed(1);
        const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        bmiInfo = `${bmi} (${bmiCategory})`;
    }

    return `You are a clinical health AI assistant for a preventive healthcare platform called VitaGuard. Analyze the following patient data and provide a structured, evidence-based health risk assessment.
    
    PATIENT DATA:
    - Name: ${formData.name || 'Anonymous'}
    - Age: ${formData.age || 'Not provided'}
    - BMI: ${bmiInfo}
    - Reported Symptoms: ${symptoms}
    - Sleep Duration: ${sleepMap[formData.sleep] || 'Not provided'}
    - Exercise Frequency: ${exerciseMap[formData.exercise] || 'Not provided'}
    - Smoking Status: ${smokingMap[formData.smoking] || 'Not provided'}
    - Alcohol Consumption: ${alcoholMap[formData.alcohol] || 'Not provided'}
    
    STRICT SCORING CRITERIA:
    1. ZERO SYMPTOMS + GOOD HABITS: If the user reports "None" for symptoms AND has good sleep (7-9h)/exercise (Regular/Daily) AND is a non-smoker, the riskScore MUST be below 15 (Low Risk).
    2. RISK SCORING (5-95):
       - 5-15 (Low): Healthy baseline, no major symptoms, proactive habits.
       - 16-35 (Moderate): Minor lifestyle risks (poor sleep/no exercise) or 1-2 mild symptoms (Fatigue/Headache).
       - 36+ (High): Significant symptoms (Chest Pain, Shortness of Breath) or multiple chronic lifestyle risks.
    3. CLINICAL REASONING: Be objective. Do not default to high risk just for "safety"—be accurate to the data provided.
    
    INSTRUCTIONS:
    - Generate a riskScore (5-95) and riskLevel (Low < 16, Moderate 16-35, High > 35).
    - Provide 4 clinical recommendations based ONLY on their reported data.
    - Provide 4 daily tips personalized to their age and lifestyle.
    - Calculate sub-category risk scores (0-100) for Cardiovascular, Respiratory, and Metabolic health.
    - Write a 2-3 sentence summary that references their EXACT metrics and interpreted custom symptoms.
    
    SPECIAL CRITERIA FOR CUSTOM SYMPTOMS:
    - If the patient provides custom text in 'Reported Symptoms', prioritize its interpretation. 
    - For example, 'fever' should trigger respiratory/metabolic concern. 'stress' should trigger lifestyle tips. 
    - Reference their specific typed words in the recommendations.
    
    IMPORTANT: Respond ONLY with valid JSON in the following exact format. No markdown, no code fences, no extra text:
{
    "riskScore": <number 5-75>,
    "riskLevel": "<Low|Moderate|High>",
    "summary": "<A 2-3 sentence personalized clinical summary referencing actual patient data>",
    "recommendations": [
        "<specific recommendation 1>",
        "<specific recommendation 2>",
        "<specific recommendation 3>",
        "<specific recommendation 4>"
    ],
    "tips": [
        "<personalized daily health tip 1>",
        "<personalized daily health tip 2>",
        "<personalized daily health tip 3>",
        "<personalized daily health tip 4>"
    ],
    "details": [
        { "category": "Cardiovascular", "risk": "<Low|Moderate|Elevated>", "score": <number 0-100> },
        { "category": "Respiratory", "risk": "<Low|Moderate|Elevated>", "score": <number 0-100> },
        { "category": "Metabolic", "risk": "<Low|Moderate|Elevated>", "score": <number 0-100> }
    ],
    "dietOptions": [
        "<personalized diet recommendation 1>",
        "<personalized diet recommendation 2>",
        "<personalized diet recommendation 3>",
        "<personalized diet recommendation 4>"
    ]
}

QUALITY GUIDELINES (STRICT):
1. NO REPETITION: Each recommendation and tip must be unique. Do not repeat the same advice in different words.
2. CLINICAL DEPTH: Provide logical, evidence-based answers. Use specific nutrients (e.g., 'Magnesium for muscle cramps') rather than generic 'Eat healthy'.
3. DIET FOCUS: Tailor diet options to their symptoms (e.g., if acid reflux is mentioned, avoid spicy foods).
4. CONCISE & LOGICAL: Stick to the question. Do not provide fluff.`;
}

/**
 * Call the Gemini API with the health analysis prompt.
 * Falls back to a local deterministic engine if the API is unavailable.
 * 
 * @param {Object} formData - The user's health form data
 * @returns {Object} Analysis result with source indicator
 */
export async function analyzeHealthWithGemini(formData) {
    const client = getClient();

    if (!client) {
        return generateFallbackAnalysis(formData);
    }

    try {
        // Use the latest stable Gemini Flash model for speed and reliability
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = buildPrompt(formData);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean potential markdown code fences
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);

        // Validate the response structure
        if (!parsed.riskScore || !parsed.recommendations || !parsed.details) {
            throw new Error('Invalid response structure from Gemini');
        }

        return {
            success: true,
            source: 'gemini',
            data: {
                riskLevel: parsed.riskLevel || 'Moderate',
                score: Math.min(75, Math.max(5, parsed.riskScore)),
                date: new Date().toLocaleDateString(),
                userName: formData.name || 'User',
                summary: parsed.summary,
                recommendations: parsed.recommendations.slice(0, 4),
                tips: parsed.tips?.slice(0, 4) || [],
                details: parsed.details.slice(0, 3),
                dietOptions: parsed.dietOptions?.slice(0, 4) || []
            }
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return generateFallbackAnalysis(formData);
    }
}

/**
 * ===================================================================
 * DETERMINISTIC FALLBACK ANALYSIS ENGINE
 * ===================================================================
 * Used when the Gemini API is unavailable or not configured.
 * 
 * This engine calculates risk scores based ENTIRELY on the user's
 * actual input data. NO random numbers are used.
 * 
 * Scoring methodology:
 * - Base score starts at 5 (minimum healthy baseline)
 * - Symptom severity adds 3-6 points per symptom
 * - Lifestyle risk factors add 2-5 points each
 * - Co-occurring symptom patterns add bonus risk
 * - Age-based risk adjustment applied
 * - BMI-based risk adjustment applied
 * ===================================================================
 */
function generateFallbackAnalysis(formData) {
    const symptoms = formData.symptoms || [];
    const age = parseInt(formData.age) || 25;
    const weight = parseFloat(formData.weight) || 0;
    const height = parseFloat(formData.height) || 170;

    // Calculate BMI
    const heightM = height / 100;
    const bmi = weight > 0 ? weight / (heightM * heightM) : 22; // Default healthy BMI

    // ========== CALCULATE DETERMINISTIC RISK SCORE ==========
    let riskScore = 0; // Absolute healthy baseline
    const hasOther = formData.otherSymptoms?.trim().length > 0;

    // If perfectly healthy with no symptoms, keep it at 0
    if ((symptoms.includes('None of the above') || symptoms.length === 0) && !hasOther) {
        riskScore = 0;
    }

    // Base score bump for custom symptoms
    if (hasOther) riskScore += 5;

    // Symptom-based scoring
    const symptomWeights = {
        'Chest Pain': 6,
        'Shortness of Breath': 5,
        'Fatigue': 3,
        'Dizziness': 4,
        'Persistent Cough': 3,
        'Nausea': 3,
        'Frequent Urination': 4,
        'Headache': 2
    };

    symptoms.forEach(s => {
        riskScore += symptomWeights[s] || 3;
    });

    // Co-occurrence bonus (dangerous symptom combinations)
    if (symptoms.includes('Chest Pain') && symptoms.includes('Shortness of Breath')) riskScore += 5;
    if (symptoms.includes('Fatigue') && symptoms.includes('Dizziness')) riskScore += 3;
    if (symptoms.includes('Nausea') && symptoms.includes('Frequent Urination')) riskScore += 3;

    // Lifestyle scoring
    const lifestyleScores = {
        sleep: { 'less_5': 5, '5_7': 2, '7_9': 0, '9_plus': 1 },
        exercise: { 'never': 5, 'sometimes': 2, 'regular': 0, 'daily': -1 },
        smoking: { 'non': 0, 'former': 2, 'occasional': 4, 'regular': 6 },
        alcohol: { 'none': 0, 'low': 1, 'moderate': 3, 'high': 5 }
    };

    riskScore += lifestyleScores.sleep[formData.sleep] || 0;
    riskScore += lifestyleScores.exercise[formData.exercise] || 0;
    riskScore += lifestyleScores.smoking[formData.smoking] || 0;
    riskScore += lifestyleScores.alcohol[formData.alcohol] || 0;

    // Age-based adjustment
    if (age > 50) riskScore += 4;
    else if (age > 40) riskScore += 2;
    else if (age > 30) riskScore += 1;

    // BMI-based adjustment
    if (bmi > 30) riskScore += 4;        // Obese
    else if (bmi > 25) riskScore += 2;   // Overweight
    else if (bmi < 18.5) riskScore += 2; // Underweight

    // Clamp to valid range (0-95)
    riskScore = Math.min(95, Math.max(0, riskScore));

    // ========== DETERMINE RISK LEVEL ==========
    const getRiskLevel = (score) => {
        if (score < 16) return "Low";
        if (score <= 35) return "Moderate";
        return "High";
    };

    const riskLevel = getRiskLevel(riskScore);

    // ========== GENERATE RECOMMENDATIONS ==========
    const recommendations = [];

    if (symptoms.includes('Chest Pain')) {
        recommendations.push("Consult a cardiologist for a detailed ECG and stress test to evaluate your chest discomfort.");
    }
    if (symptoms.includes('Shortness of Breath')) {
        recommendations.push("Schedule a pulmonary function test (spirometry) to assess your respiratory capacity.");
    }
    if (symptoms.includes('Fatigue')) {
        recommendations.push("Get a complete blood panel to check for iron deficiency, Vitamin D, and thyroid markers (TSH).");
    }
    if (symptoms.includes('Dizziness')) {
        recommendations.push("Monitor blood pressure twice daily for a week and track hydration levels (target 2.5L+ daily).");
    }
    if (symptoms.includes('Persistent Cough')) {
        recommendations.push("If your cough persists beyond 3 weeks, schedule a chest X-ray to rule out respiratory infections.");
    }
    if (symptoms.includes('Nausea')) {
        recommendations.push("Review your current diet and medication list — nausea can be triggered by drug interactions or food sensitivities.");
    }
    if (symptoms.includes('Frequent Urination')) {
        recommendations.push("Get a fasting blood glucose and HbA1c test to screen for early metabolic risk markers.");
    }
    if (symptoms.includes('Headache')) {
        recommendations.push("Track headache frequency and triggers for 2 weeks; consult a neurologist if they occur 3+ times/week.");
    }

    // Lifestyle recommendations
    if (formData.sleep === 'less_5') {
        recommendations.push("Increase sleep to 7-8 hours: chronic sleep deprivation elevates cortisol and cardiovascular risk.");
    }
    if (formData.exercise === 'never') {
        recommendations.push("Begin with 20 minutes of brisk walking daily — even light exercise reduces all-cause mortality by 20%.");
    }
    if (formData.smoking === 'regular' || formData.smoking === 'occasional') {
        recommendations.push("Initiate a smoking cessation plan — even reducing by 50% significantly lowers respiratory and cardiovascular risk.");
    }
    if (bmi > 30) {
        recommendations.push(`Your BMI of ${bmi.toFixed(1)} indicates obesity. A structured nutrition plan with 500 kcal/day deficit is recommended.`);
    }

    // Keyword scanning for custom 'Other' symptoms (Fallback)
    if (hasOther) {
        const otherLower = formData.otherSymptoms.toLowerCase();
        if (otherLower.includes('pain') || otherLower.includes('ache')) {
            recommendations.push(`Regarding your "${formData.otherSymptoms}": Persistent pain should be evaluated for underlying inflammation.`);
        }
        if (otherLower.includes('fever') || otherLower.includes('cold') || otherLower.includes('cough')) {
            recommendations.push(`For your respiratory/flu concern: Monitor temperature and stay hydrated.`);
        }
        if (otherLower.includes('stress') || otherLower.includes('anxiety') || otherLower.includes('mental')) {
            recommendations.push(`Note on your stress levels: We recommend exploring mindfulness or speaking with a counselor.`);
        }
        if (recommendations.length < 4) {
            recommendations.push(`Specific Note: Your report of "${formData.otherSymptoms}" has been flagged for your review.`);
        }
    }

    // Healthy profile fallback
    if (recommendations.length === 0) {
        recommendations.push("Maintain your current balanced routine — your baseline metrics are within healthy ranges.");
        recommendations.push("Schedule an annual preventive health screening appropriate for your age group.");
        recommendations.push("Continue regular physical activity and adequate hydration (2-3L daily).");
        recommendations.push("Monitor any changes in energy levels, sleep quality, or unexplained symptoms.");
    }

    // ========== GENERATE TIPS ==========
    const tips = [];

    if (formData.sleep === 'less_5' || formData.sleep === '5_7') {
        tips.push("Set a consistent sleep schedule — go to bed and wake up at the same time, even on weekends.");
    } else {
        tips.push("Maintain your healthy sleep routine and avoid screens 30 minutes before bed.");
    }

    if (formData.exercise === 'never' || formData.exercise === 'sometimes') {
        tips.push("Take a 10-minute walk after each meal — this improves blood sugar regulation by up to 30%.");
    } else {
        tips.push("Include both cardio and strength training in your weekly routine for comprehensive fitness.");
    }

    if (age > 40) {
        tips.push("Prioritize calcium and Vitamin D intake to support bone density as you age.");
    } else {
        tips.push("Build stress-management habits now — try 5 minutes of daily meditation or journaling.");
    }

    tips.push("Eat a variety of colorful vegetables daily — aim for at least 5 different colors per week for micronutrient diversity.");

    // ========== GENERATE DIET OPTIONS (Fallback) ==========
    const dietOptions = [];
    if (symptoms.includes('Fatigue') || (hasOther && formData.otherSymptoms.toLowerCase().includes('energy'))) {
        dietOptions.push("Complex carbohydrates (oats, quinoa) for sustained energy release throughout the day.");
        dietOptions.push("Iron-rich foods (spinach, lentils) to support healthy oxygen transport in the blood.");
    }
    if (symptoms.includes('Frequent Urination') || (hasOther && formData.otherSymptoms.toLowerCase().includes('sugar'))) {
        dietOptions.push("Low glycemic index foods to maintain stable blood sugar levels.");
        dietOptions.push("High-fiber vegetables (broccoli, leafy greens) to improve metabolic processing.");
    }
    if (symptoms.includes('Headache') || symptoms.includes('Dizziness')) {
        dietOptions.push("Magnesium-rich foods (almonds, pumpkin seeds) which may help reduce headache frequency.");
        dietOptions.push("Electrolyte-balanced hydration (coconut water) to maintain proper neural function.");
    }
    if (dietOptions.length < 3) {
        dietOptions.push("Increase intake of Omega-3 fatty acids (walnuts, chia seeds) to support systemic anti-inflammation.");
        dietOptions.push("Prioritize high-quality protein (eggs, legumes) for tissue repair and immune support.");
    }

    // ========== GENERATE SUMMARY ==========
    let summary = '';
    const totalSymptomCount = symptoms.length + (hasOther ? 1 : 0);
    if (riskLevel === "High") {
        summary = `Based on your ${totalSymptomCount} reported symptom${totalSymptomCount !== 1 ? 's' : ''} and lifestyle profile, your overall health risk is categorized as High (${riskScore}%). `;
        summary += "We strongly recommend scheduling a consultation with a healthcare professional to discuss diagnostic testing and a personalized care plan.";
    } else if (riskLevel === "Moderate") {
        summary = `Your health profile shows ${totalSymptomCount} symptom${totalSymptomCount !== 1 ? 's' : ''} that, combined with your lifestyle factors, place you in the Moderate risk category (${riskScore}%). `;
        summary += "While not immediately critical, proactive lifestyle changes and symptom monitoring can significantly reduce your long-term risk.";
    } else {
        summary = `With ${totalSymptomCount === 0 ? 'no reported symptoms' : totalSymptomCount + ' symptom' + (totalSymptomCount !== 1 ? 's' : '')} and a generally healthy lifestyle, your risk profile is Low (${riskScore}%). `;
        summary += "Continue maintaining your current habits and stay consistent with regular preventive check-ups.";
    }

    // ========== CALCULATE CATEGORY SCORES ==========
    let cardiovascularScore = 5;
    if (symptoms.includes('Chest Pain')) cardiovascularScore += 25;
    if (symptoms.includes('Dizziness')) cardiovascularScore += 10;
    if (symptoms.includes('Shortness of Breath')) cardiovascularScore += 10;
    if (formData.smoking === 'regular') cardiovascularScore += 15;
    else if (formData.smoking === 'occasional') cardiovascularScore += 8;
    if (formData.exercise === 'never') cardiovascularScore += 10;
    if (bmi > 30) cardiovascularScore += 10;
    else if (bmi > 25) cardiovascularScore += 5;
    if (age > 50) cardiovascularScore += 8;
    cardiovascularScore = Math.min(100, cardiovascularScore);

    let respiratoryScore = 5;
    if (symptoms.includes('Shortness of Breath')) respiratoryScore += 25;
    if (symptoms.includes('Persistent Cough')) respiratoryScore += 20;
    if (formData.smoking === 'regular') respiratoryScore += 20;
    else if (formData.smoking === 'occasional') respiratoryScore += 10;
    else if (formData.smoking === 'former') respiratoryScore += 5;
    if (symptoms.includes('Chest Pain')) respiratoryScore += 5;
    respiratoryScore = Math.min(100, respiratoryScore);

    let metabolicScore = 5;
    if (symptoms.includes('Frequent Urination')) metabolicScore += 20;
    if (symptoms.includes('Fatigue')) metabolicScore += 10;
    if (symptoms.includes('Nausea')) metabolicScore += 8;
    if (formData.exercise === 'never') metabolicScore += 10;
    if (bmi > 30) metabolicScore += 15;
    else if (bmi > 25) metabolicScore += 8;
    if (formData.alcohol === 'high') metabolicScore += 10;
    else if (formData.alcohol === 'moderate') metabolicScore += 5;
    metabolicScore = Math.min(100, metabolicScore);

    const getRiskLabel = (score) => score > 40 ? "Elevated" : score > 20 ? "Moderate" : "Low";

    const details = [
        { category: "Cardiovascular", risk: getRiskLabel(cardiovascularScore), score: cardiovascularScore },
        { category: "Respiratory", risk: getRiskLabel(respiratoryScore), score: respiratoryScore },
        { category: "Metabolic", risk: getRiskLabel(metabolicScore), score: metabolicScore }
    ];

    return {
        success: true,
        source: 'fallback',
        data: {
            riskLevel,
            score: riskScore,
            date: new Date().toLocaleDateString(),
            userName: formData.name || 'User',
            summary,
            recommendations: recommendations.slice(0, 4),
            tips: tips.slice(0, 4),
            details,
            dietOptions: dietOptions.slice(0, 4)
        }
    };
}

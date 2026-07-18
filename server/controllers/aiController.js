const expressAsyncHandler = require('express-async-handler');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Department = require('../models/Department');

const checkSymptoms = expressAsyncHandler(async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms) {
    return res.status(400).json({ success: false, message: 'Please provide symptoms.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ success: false, message: 'AI Assistant is currently unavailable (Missing API Key).' });
  }

  // Fetch all available departments to feed to AI context
  const departments = await Department.find({}, 'name description');
  
  const deptsContext = departments.map(d => `- ${d.name}: ${d.description}`).join('\n');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a helpful AI medical assistant for a hospital. A patient has described their symptoms.
Your job is to recommend the MOST appropriate hospital department from our list.

Available Departments:
${deptsContext}

Patient's Symptoms: "${symptoms}"

Provide your response in JSON format exactly like this:
{
  "departmentName": "Recommended Department Name from the list",
  "reason": "A short, compassionate explanation of why this department is suitable.",
  "firstAidAdvice": "Basic non-prescription first-aid or immediate care advice, with a disclaimer."
}
Only output the JSON object, nothing else. No markdown wrappers.
`;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up potential markdown wrappers
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/, '').replace(/```$/, '');
    }

    const aiResponse = JSON.parse(responseText.trim());

    res.status(200).json({
      success: true,
      recommendation: aiResponse
    });

  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process symptoms with AI.' });
  }
});

module.exports = { checkSymptoms };

import fs from 'fs';
import path from 'path';

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Load questions from the JSON file
    const questionsPath = path.join(process.cwd(), 'quiz_questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf8');
    const questions = JSON.parse(questionsData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(questions)
    };
  } catch (error) {
    console.error('Error loading questions:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to load quiz questions',
        message: error.message 
      })
    };
  }
};

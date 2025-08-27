import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PropTypes from 'prop-types';

const questions = [
  "What does HTTP stand for?",
  "What does AI stand for?",
  "What does URL stand for?",
  "What does IP stand for?",
  "What does SQL stand for?",
  "What does USB stand for?",
  "What does VPN stand for?",
  "What does API stand for?",
  "What does PDF stand for?",
  "What does CPU stand for?"
];

const correctAnswers = [
  "HyperText Transfer Protocol",
  "Artificial Intelligence",
  "Uniform Resource Locator",
  "Internet Protocol",
  "Structured Query Language",
  "Universal Serial Bus",
  "Virtual Private Network",
  "Application Programming Interface",
  "Portable Document Format",
  "Central Processing Unit"
];

// Auto-correct suggestions for each question
const autoCorrectSuggestions = [
  ["HTTP", "HyperText Transfer Protocol", "hypertext transfer protocol", "hyper text transfer protocol", "hypertext-transfer-protocol"],
  ["AI", "Artificial Intelligence", "artificial intelligence", "artifical intelligence", "artificial-intelligence"],
  ["URL", "Uniform Resource Locator", "uniform resource locator", "uniform resource locater", "uniform-resource-locator"],
  ["IP", "Internet Protocol", "internet protocol", "internet protocal", "internet-protocol"],
  ["SQL", "Structured Query Language", "structured query language", "structured querry language", "structured-query-language"],
  ["USB", "Universal Serial Bus", "universal serial bus", "universal sereal bus", "universal-serial-bus"],
  ["VPN", "Virtual Private Network", "virtual private network", "virtual privite network", "virtual-private-network"],
  ["API", "Application Programming Interface", "application programming interface", "application programing interface", "app programming interface"],
  ["PDF", "Portable Document Format", "portable document format", "portable documnet format", "portable-document-format"],
  ["CPU", "Central Processing Unit", "central processing unit", "central procesing unit", "central-processing-unit", "processor"]
];

function App() {
  const [answers, setAnswers] = useState(Array(10).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState({});

  // Function to calculate Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Function to get auto-correct suggestions
  const getAutoCorrectSuggestions = (questionIndex, input) => {
    if (!input || input.length < 2) return [];
    
    const questionSuggestions = autoCorrectSuggestions[questionIndex] || [];
    const inputLower = input.toLowerCase();
    
    // Find suggestions that match the input
    const matches = questionSuggestions.filter(suggestion => {
      const suggestionLower = suggestion.toLowerCase();
      
      // Exact match or starts with input
      if (suggestionLower.includes(inputLower) || inputLower.includes(suggestionLower)) {
        return true;
      }
      
      // Fuzzy match using Levenshtein distance
      const distance = levenshteinDistance(inputLower, suggestionLower);
      const threshold = Math.max(2, Math.floor(suggestionLower.length * 0.3));
      return distance <= threshold;
    });
    
    // Sort by relevance (exact matches first, then by similarity)
    return matches.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      if (aLower.startsWith(inputLower) && !bLower.startsWith(inputLower)) return -1;
      if (!aLower.startsWith(inputLower) && bLower.startsWith(inputLower)) return 1;
      
      return levenshteinDistance(inputLower, aLower) - levenshteinDistance(inputLower, bLower);
    }).slice(0, 5); // Limit to 5 suggestions
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    // Get auto-correct suggestions
    const newSuggestions = getAutoCorrectSuggestions(index, value);
    setSuggestions(prev => ({
      ...prev,
      [index]: newSuggestions
    }));
    
    // Reset active suggestion index
    setActiveSuggestionIndex(prev => ({
      ...prev,
      [index]: 0
    }));
  };

  const handleSuggestionClick = (questionIndex, suggestion) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = suggestion;
    setAnswers(newAnswers);
    
    // Clear suggestions for this question
    setSuggestions(prev => ({
      ...prev,
      [questionIndex]: []
    }));
  };

  const handleKeyDown = (e, questionIndex) => {
    const questionSuggestions = suggestions[questionIndex] || [];
    if (questionSuggestions.length === 0) return;
    
    const currentActive = activeSuggestionIndex[questionIndex] || 0;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => ({
          ...prev,
          [questionIndex]: Math.min(currentActive + 1, questionSuggestions.length - 1)
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => ({
          ...prev,
          [questionIndex]: Math.max(currentActive - 1, 0)
        }));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (questionSuggestions[currentActive]) {
          handleSuggestionClick(questionIndex, questionSuggestions[currentActive]);
        }
        break;
      case 'Escape':
        setSuggestions(prev => ({
          ...prev,
          [questionIndex]: []
        }));
        break;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Please set VITE_GEMINI_API_KEY in your .env.local file');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `
You are grading a quiz. Here are 10 fill-in-the-blank questions with their correct answers and the student's answers.
You are performing auto-scoring - award points automatically for correct answers.

Questions and Correct Answers:
1. What does HTTP stand for? (Correct: HyperText Transfer Protocol)
2. What does AI stand for? (Correct: Artificial Intelligence)
3. What does URL stand for? (Correct: Uniform Resource Locator)
4. What does IP stand for? (Correct: Internet Protocol)
5. What does SQL stand for? (Correct: Structured Query Language)
6. What does USB stand for? (Correct: Universal Serial Bus)
7. What does VPN stand for? (Correct: Virtual Private Network)
8. What does API stand for? (Correct: Application Programming Interface)
9. What does PDF stand for? (Correct: Portable Document Format)
10. What does CPU stand for? (Correct: Central Processing Unit)

Student Answers:
${answers.map((answer, index) => `${index + 1}. ${answer || '[blank]'}`).join('\n')}

DETAILED GRADING INSTRUCTIONS:

AUTO-CORRECTION RULES:

GENERAL RULES:
- ALWAYS ignore case differences (e.g., "hypertext transfer protocol" = "HyperText Transfer Protocol")
- Handle extra spaces, punctuation, or formatting issues
- Accept articles and prepositions: "the HTTP", "an API" etc.
- Remove unnecessary words but preserve technical accuracy
- Accept both acronym and full form as correct (e.g., "HTTP" = "HyperText Transfer Protocol")

QUESTION-SPECIFIC CORRECTIONS:

Q1 (HyperText Transfer Protocol):
- Accept: "HTTP", "hypertext transfer protocol", "Hypertext Transfer Protocol", "HYPERTEXT TRANSFER PROTOCOL"
- Common variations: "hyper text transfer protocol", "hypertext-transfer-protocol", "hypertext transfer protocol"
- Misspellings: "hypertxt transfer protocol", "hypertext trasfer protocol", "hypertext transfer protocal"
- Abbreviations: Just "HTTP" should be accepted as correct

Q2 (Artificial Intelligence):
- Accept: "AI", "artificial intelligence", "Artificial Intelligence", "ARTIFICIAL INTELLIGENCE"
- Common variations: "artifical intelligence", "artificial-intelligence"
- Misspellings: "artifical intelligence", "articial intelligence", "artificial inteligence"
- Abbreviations: Just "AI" should be accepted as correct

Q3 (Uniform Resource Locator):
- Accept: "URL", "uniform resource locator", "Uniform Resource Locator", "UNIFORM RESOURCE LOCATOR"
- Common variations: "uniform-resource-locator", "uniform resource locater"
- Misspellings: "uniform resourse locator", "uniform resource locater", "uniform resorce locator"
- Abbreviations: Just "URL" should be accepted as correct

Q4 (Internet Protocol):
- Accept: "IP", "internet protocol", "Internet Protocol", "INTERNET PROTOCOL"
- Common variations: "internet-protocol"
- Misspellings: "internet protocal", "internet protacol", "intenet protocol"
- Abbreviations: Just "IP" should be accepted as correct

Q5 (Structured Query Language):
- Accept: "SQL", "structured query language", "Structured Query Language", "STRUCTURED QUERY LANGUAGE"
- Common variations: "structured-query-language"
- Misspellings: "structured querry language", "structured query langugage", "structered query language"
- Abbreviations: Just "SQL" should be accepted as correct

Q6 (Universal Serial Bus):
- Accept: "USB", "universal serial bus", "Universal Serial Bus", "UNIVERSAL SERIAL BUS"
- Common variations: "universal-serial-bus"
- Misspellings: "universal sereal bus", "universal serial buss", "universal cerial bus"
- Abbreviations: Just "USB" should be accepted as correct

Q7 (Virtual Private Network):
- Accept: "VPN", "virtual private network", "Virtual Private Network", "VIRTUAL PRIVATE NETWORK"
- Common variations: "virtual-private-network"
- Misspellings: "virtual privite network", "virtual private netwrok", "virtuel private network"
- Abbreviations: Just "VPN" should be accepted as correct

Q8 (Application Programming Interface):
- Accept: "API", "application programming interface", "Application Programming Interface", "APPLICATION PROGRAMMING INTERFACE"
- Common variations: "application-programming-interface", "app programming interface"
- Misspellings: "application programing interface", "aplication programming interface", "application programming interfce"
- Abbreviations: Just "API" should be accepted as correct

Q9 (Portable Document Format):
- Accept: "PDF", "portable document format", "Portable Document Format", "PORTABLE DOCUMENT FORMAT"
- Common variations: "portable-document-format"
- Misspellings: "portable documnet format", "portabel document format", "portable document fromat"
- Abbreviations: Just "PDF" should be accepted as correct

Q10 (Central Processing Unit):
- Accept: "CPU", "central processing unit", "Central Processing Unit", "CENTRAL PROCESSING UNIT"
- Common variations: "central-processing-unit", "central processor unit"
- Misspellings: "central procesing unit", "central processing uit", "central proccessing unit"
- Related terms: "processor", "main processor" (partial credit)
- Abbreviations: Just "CPU" should be accepted as correct

PHONETIC & SPELLING CORRECTIONS:
- Apply aggressive spell-checking for common typos
- Accept phonetic spellings that sound similar
- Correct keyboard adjacent errors (e.g., 'r' instead of 't')
- Fix doubled letters or missing letters
- Handle autocorrect failures

SCORING GUIDELINES:
- You are performing AUTO-SCORING - award points automatically for correct answers
- Each question is worth exactly 10 points (total possible: 100 points)
- Award FULL CREDIT (10 points) for:
  * Exact matches after auto-correction
  * Semantically equivalent answers (e.g., "Au" and "Gold" for chemical symbol)
  * Minor variations that show clear understanding
- Award PARTIAL CREDIT (5-8 points) for:
  * Answers that are close but not quite right
  * Answers showing partial understanding
- Award NO CREDIT (0 points) only for:
  * Completely wrong answers
  * Blank responses
  * Nonsensical responses

FEEDBACK REQUIREMENTS:
- For CORRECT answers: Explain what auto-corrections were made (if any)
- For INCORRECT answers: Explain why it's wrong and what the correct answer should be
- For PARTIAL CREDIT: Explain what was right and what was missing
- Be encouraging and educational in your feedback

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure (no additional text):
{
  "score": <integer 0-100>,
  "details": [
    {
      "questionNumber": 1,
      "studentAnswer": "...",
      "correctAnswer": "...",
      "status": "correct|incorrect",
      "reason": "...",
      "pointsAwarded": <integer 0-10>,
      "autoCorrections": "..."
    },
    ...
  ]
}

IMPORTANT: Be generous with auto-correction and scoring. The goal is to test knowledge, not perfect spelling.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }

      const parsedResults = JSON.parse(jsonMatch[0]);
      setResults(parsedResults);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to grade quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers(Array(10).fill(''));
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">QuizGemini</h1>
          </div>

          {!results && (
            <>
              <div className="space-y-6 mb-8">
                {questions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200 relative">
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      {index + 1}. {question}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={answers[index]}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
                        placeholder="Enter your answer..."
                        disabled={isSubmitting}
                        autoComplete="off"
                      />
                      
                      {/* Auto-correct suggestions dropdown */}
                      {suggestions[index] && suggestions[index].length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                          {suggestions[index].map((suggestion, suggestionIndex) => (
                            <div
                              key={suggestionIndex}
                              className={`px-4 py-2 cursor-pointer transition-colors ${
                                suggestionIndex === (activeSuggestionIndex[index] || 0)
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={() => handleSuggestionClick(index, suggestion)}
                            >
                              <span className="text-sm font-medium">{suggestion}</span>
                            </div>
                          ))}
                          <div className="px-4 py-1 text-xs text-gray-500 border-t border-gray-200">
                            Use ↑↓ to navigate, Enter/Tab to select, Esc to close
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || answers.every(answer => !answer.trim())}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Grading...' : 'Submit Quiz'}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-800">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              <div className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
                <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-xl">Score: {results.score} / 100</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detailed Results:</h3>
                {results.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-lg border-2 ${
                      detail.status === 'correct'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-lg text-gray-800">
                        Question {detail.questionNumber}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          detail.status === 'correct'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {detail.status}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Answer:</p>
                        <p className="text-gray-800">{detail.studentAnswer || '[blank]'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Correct Answer:</p>
                        <p className="text-gray-800">{detail.correctAnswer}</p>
                      </div>
                    </div>
                    {detail.pointsAwarded !== undefined && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Points Awarded:</p>
                        <p className="text-gray-800">{detail.pointsAwarded} / 10</p>
                      </div>
                    )}
                    {detail.autoCorrections && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Auto-Corrections Applied:</p>
                        <p className="text-gray-800 italic">{detail.autoCorrections}</p>
                      </div>
                    )}
                    {detail.reason && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Feedback:</span> {detail.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center pt-6">
                <button
                  onClick={resetQuiz}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
                >
                  Take Quiz Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
# QuizGemini

A React + Vite single-page application that uses Google's Gemini AI to intelligently grade fill-in-the-blank quizzes with spelling and grammar correction.

## Features

- 10 fill-in-the-blank questions covering general knowledge
- AI-powered grading using Google Gemini API
- Intelligent spelling and grammar correction
- Detailed feedback for each answer
- Clean, responsive design
- Real-time score calculation (0-100 points)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   ```bash
   echo "VITE_GEMINI_API_KEY=AIzaSyBXePyyhKKV4FXJfOrvUu0ktgjE5vJh5KA" > .env.local
   ```
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to use the quiz application.

## How It Works

1. Answer the 10 fill-in-the-blank questions
2. Click "Submit Quiz" to have Gemini AI grade your answers
3. The AI will:
   - Ignore case differences
   - Auto-correct minor spelling/grammar mistakes
   - Provide detailed feedback for each answer
4. View your score and detailed results

## Technologies Used

- React 18
- Vite
- Google Generative AI (@google/generative-ai)
- Tailwind CSS

## Environment Variables

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required)

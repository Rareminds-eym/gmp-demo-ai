# QuizGemini

A React + Vite single-page application that uses Google's Gemini AI to intelligently grade fill-in-the-blank quizzes with spelling and grammar correction.

## Features

- 10 fill-in-the-blank questions covering general knowledge
- AI-powered grading using Google Gemini API
- Intelligent spelling and grammar correction
- Detailed feedback for each answer
- Clean, responsive design
- Real-time score calculation (0-100 points)
- Google Drive PDF evaluation for hackathon submissions

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

3. **Google Drive API Setup (for PDF evaluation feature):**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials (Client ID for Web Application)
   - Add your domain to the authorized JavaScript origins
   - Add the Client ID to your `.env.local` file:
     ```
     VITE_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
     ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` to use the quiz application.

## How It Works

1. Answer the 10 fill-in-the-blank questions
2. Click "Submit Quiz" to have Gemini AI grade your answers
3. The AI will:
   - Ignore case differences
   - Auto-correct minor spelling/grammar mistakes
   - Provide detailed feedback for each answer
4. View your score and detailed results

### Google Drive PDF Evaluation

1. Connect to your Google Drive account using the "Connect Google Drive" button
2. Select PDF files containing hackathon submissions
3. Click "Evaluate Selected PDFs" to process the submissions
4. The AI will:
   - Extract text content from the PDFs
   - Evaluate submissions based on the same criteria as the quiz system
   - Provide detailed feedback and scores for each submission

## Technologies Used

- React 18
- Vite
- Google Generative AI (@google/generative-ai)
- Google Drive API (googleapis)
- PDF.js (pdfjs-dist)
- Tailwind CSS
- Lucide React Icons

## Environment Variables

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required)
- `VITE_GOOGLE_DRIVE_CLIENT_ID`: Your Google Drive OAuth 2.0 Client ID (required for PDF evaluation)

# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Case-Based Quiz System** built as a React application for evaluating hackathon participants' innovation journeys. The system uses Google's Gemini AI to evaluate user responses across 10 stages of innovation development, with responses contextualized against specific pharmaceutical case studies.

## Architecture & Key Components

### Application Structure
- **React 18 + Vite** - Modern React development setup with fast HMR
- **TypeScript/JavaScript Mix** - Main components in JSX, data models in TypeScript
- **Tailwind CSS** - Utility-first styling throughout the application
- **Supabase** - Database backend for user progress and responses
- **Google Gemini AI** - LLM integration for intelligent evaluation

### Core Architecture Flow
```
User Search → Supabase Query → Case Display → Stage Navigation → AI Evaluation
```

### Main Components
- **`UserSearch.jsx`** - Handles user lookup, batch processing, and database queries
- **`CaseQuestions.jsx`** - Manages the 10-stage hackathon journey and AI validation
- **`BatchEvaluationProcessor.jsx`** - Processes multiple users with AI evaluation in batches
- **Data Layer** - `HackathonData.ts` (20 pharmaceutical case studies), `Question.ts` (stage prompts)

### Database Schema Context
The app queries the `level2_screen3_progress` table with these key fields:
- User identification: `email`, `user_id`
- Progress tracking: `current_stage`, `progress_percentage`, `is_completed`
- Case assignment: `case_id`, `selected_case_id`
- Stage responses: `idea_statement`, `stage2_problem` through `stage10_reflection`
- Final consolidated answers: `stage8_final_*` fields

## Development Commands

### Setup & Development
```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

### Environment Setup
Create `.env.local` file with required API keys:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Development Patterns

### AI Integration Pattern
The application uses a sophisticated AI evaluation system:
1. **Context-Aware Evaluation** - All responses evaluated against specific pharmaceutical case studies
2. **Structured Prompting** - Consistent JSON response format with stage-by-stage scoring
3. **Error Handling** - Robust parsing of AI responses with fallback error states

### Database Integration Pattern
- **Service Layer** - `databaseService.js` provides reusable query functions
- **Real-time Search** - Debounced user search with live suggestions
- **Batch Processing** - Sequential processing with offset-based pagination using `start_id`

### State Management Pattern
- Component-level state with React hooks
- LocalStorage for persistence (completed users tracking)
- Props drilling for user data between components

### Styling Architecture
- **Tailwind CSS** with consistent design system
- **Responsive Design** - Mobile-first approach
- **Status Indicators** - Color-coded feedback (excellent/good/needs_improvement/poor)
- **Gradient Backgrounds** - Stage-specific color themes

## Important Implementation Details

### Case Study Integration
- 20 pharmaceutical manufacturing case studies with GMP violations
- Each case has violation options, root causes, and solutions
- AI evaluation prioritizes case study relevance over generic innovation criteria

### Batch Processing System
- Processes users in batches of 5 for AI evaluation
- Uses `start_id` field for sequential ordering
- Skips previously completed users (stored in LocalStorage)
- Provides progress tracking and next batch loading

### AI Evaluation Scoring
- Total score: 0-100 points
- Stage-specific weights: Idea (15), Problem (15), Creativity (15), Impact (15), Technology (10), Collaboration (10), Scale (10), Pitch (10)
- Contextual evaluation prioritizing case study understanding

### Data Persistence
- **LocalStorage** - Completed user evaluations with scores and timestamps
- **Supabase** - User progress, responses, and case assignments
- **Real-time Updates** - Live progress tracking and completion status

## Development Tips

### Working with AI Responses
- AI responses are parsed from JSON within text responses
- Always include error handling for malformed AI responses
- Use temperature 0.3 for consistent evaluation results

### Database Queries
- Use the `databaseService.js` functions rather than direct Supabase calls
- Implement proper error handling for network failures
- Consider pagination for large datasets

### Component Development
- Follow the existing stage-based component pattern
- Maintain consistent icon usage (Lucide React)
- Use the established color coding for status indicators

### Testing with Real Data
- The app connects to a live Supabase instance with real user data
- Use email-based search to find specific test users
- Batch processing allows systematic evaluation of user cohorts

## API Dependencies

- **Google Gemini AI** (`gemini-2.0-flash-exp` model) - Core evaluation engine
- **Supabase** - Database and real-time subscriptions
- **Lucide React** - Icon system throughout the application


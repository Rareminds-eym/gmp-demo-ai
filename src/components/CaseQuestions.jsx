import React, { useState, useEffect, useMemo } from 'react';
import { hackathonPrompts, getPromptById } from '../data/Question';
import { hackathonData } from '../data/HackathonData';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileText, CheckCircle, XCircle, AlertTriangle, Lightbulb, Users, Zap, Target, Rocket, Brain, MessageSquare } from 'lucide-react';

const CaseQuestions = ({ user }) => {
  const [answers, setAnswers] = useState({
    // Stage 1 - Idea components
    stage1_idea_what: '',
    stage1_idea_who: '',
    stage1_idea_how: '',
    
    // Individual stages
    stage2_problem: '',
    stage3_technology: '',
    stage4_collaboration: '',
    stage5_creativity: '',
    stage6_speed_scale: '',
    stage7_impact: '',
    stage10_reflection: '',
    
    // Final consolidated answers
    stage8_final_problem: '',
    stage8_final_technology: '',
    stage8_final_collaboration: '',
    stage8_final_creativity: '',
    stage8_final_speed_scale: '',
    stage8_final_impact: '',
    
    // Overall idea statement
    idea_statement: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [error, setError] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  // Load existing answers when user changes
  useEffect(() => {
    if (user) {
      // For Stage 1, we'll use the idea_statement for all three components
      // or parse it if it contains structured data
      const ideaStatement = user.idea_statement || '';
      
      setAnswers({
        // Stage 1 - For now, use idea_statement for all three components
        // You can later parse or split this if needed
        stage1_idea_what: ideaStatement,
        stage1_idea_who: ideaStatement,
        stage1_idea_how: ideaStatement,
        
        stage2_problem: user.stage2_problem || '',
        stage3_technology: user.stage3_technology || '',
        stage4_collaboration: user.stage4_collaboration || '',
        stage5_creativity: user.stage5_creativity || '',
        stage6_speed_scale: user.stage6_speed_scale || '',
        stage7_impact: user.stage7_impact || '',
        stage10_reflection: user.stage10_reflection || '',
        stage8_final_problem: user.stage8_final_problem || '',
        stage8_final_technology: user.stage8_final_technology || '',
        stage8_final_collaboration: user.stage8_final_collaboration || '',
        stage8_final_creativity: user.stage8_final_creativity || '',
        stage8_final_speed_scale: user.stage8_final_speed_scale || '',
        stage8_final_impact: user.stage8_final_impact || '',
        idea_statement: user.idea_statement || ''
      });
    }
  }, [user]);

  // Get the case data based on user's case_id
  const caseData = useMemo(() => {
    if (!user?.case_id) return null;
    return hackathonData.find(item => item.id === user.case_id);
  }, [user?.case_id]);

  // Component is read-only, no answer changes allowed

  const getStageIcon = (stageNum) => {
    const iconMap = {
      1: Lightbulb,
      2: Target,
      3: Zap,
      4: Users,
      5: Brain,
      6: Rocket,
      7: Target,
      8: MessageSquare,
      10: Brain
    };
    const Icon = iconMap[stageNum] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const validateAnswers = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Please set VITE_GEMINI_API_KEY in your .env.local file');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Build the prompt with questions and answers
//       const prompt = `
// You are evaluating hackathon innovation responses based on a specific case study scenario.

// **IMPORTANT EVALUATION RULES:**
// - The CASE STUDY below is the PRIMARY context that all participant responses should address
// - All subsequent questions (Stages 1-10) are SUBQUESTIONS that should relate to and build upon the case study scenario
// - Evaluate how well each response connects to and addresses the specific case study context
// - Score higher for responses that demonstrate understanding of the case study and provide relevant, contextual solutions

// **CASE STUDY (PRIMARY EVALUATION CONTEXT):**
// ${caseData?.caseFile || 'No case study provided'}

// **PARTICIPANT'S RESPONSES TO SUBQUESTIONS:**

// **Stage 1 - YOUR INNOVATION IDEA:**
// Question: "I want to solve '___' for '___' by '___'"
// What problem: ${answers.stage1_idea_what}
// Who faces it: ${answers.stage1_idea_who}
// How to solve: ${answers.stage1_idea_how}

// **Stage 2 - Problem Analysis:**
// Question: "${getPromptById(2)?.description || 'What issue or need are you addressing? Who faces this problem?'}"
// Answer: ${answers.stage2_problem}

// **Stage 3 - Technology:**
// Question: "${getPromptById(3)?.description || 'What tool, app, software, machine, or digital aid can make your solution stronger?'}"
// Answer: ${answers.stage3_technology}

// **Stage 4 - Collaboration:**
// Question: "${getPromptById(4)?.description || 'Who can you team up with to make this idea bigger?'}"
// Answer: ${answers.stage4_collaboration}

// **Stage 5 - Creativity:**
// Question: "${getPromptById(5)?.description || 'What unique feature, design, or new approach makes your idea stand out?'}"
// Answer: ${answers.stage5_creativity}

// **Stage 6 - Speed & Scale:**
// Question: "${getPromptById(6)?.description || 'How can your solution be applied quickly and scaled?'}"
// Answer: ${answers.stage6_speed_scale}

// **Stage 7 - Impact:**
// Question: "${getPromptById(7)?.description || 'How does your idea create value?'}"
// Answer: ${answers.stage7_impact}

// **Stage 8 - Final Pitch:**
// Question: "${getPromptById(8)?.description || 'Our innovation solves ___ by using ___, built with ___, adding ___. It can grow with ___ and will create ___.'}'"
// Final Problem: ${answers.stage8_final_problem}
// Final Technology: ${answers.stage8_final_technology}
// Final Collaboration: ${answers.stage8_final_collaboration}
// Final Creativity: ${answers.stage8_final_creativity}
// Final Speed & Scale: ${answers.stage8_final_speed_scale}
// Final Impact: ${answers.stage8_final_impact}

// **Stage 10 - Reflection:**
// Question: "${getPromptById(10)?.description || 'What did you learn, what would you improve?'}"
// Answer: ${answers.stage10_reflection}

// **Overall Idea Statement:**
// ${answers.idea_statement}

// **EVALUATION CRITERIA:**
// Please evaluate based on:
// 1. **CASE STUDY RELEVANCE** - How well do the responses address the specific case study scenario? (HIGHEST PRIORITY)
// 2. **CONTEXTUAL UNDERSTANDING** - Does the participant demonstrate understanding of the case study context and constraints?
// 3. Completeness and depth of responses
// 4. Innovation and creativity within the case study context
// 5. Feasibility and practicality of solutions for the case study scenario
// 6. Potential impact and scalability relevant to the case study
// 7. Coherence between stages and consistency with the case study
// 8. Quality of reflection and learning from the case study experience

// Return ONLY a valid JSON object with this structure:
// {
//   "totalScore": <integer 0-100>,
//   "stageScores": {
//     "idea": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "problem": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "technology": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "collaboration": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "creativity": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "scale": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "impact": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
//     "pitch": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"}
//   },
//   "overallFeedback": "comprehensive feedback with strengths, areas for improvement, and suggestions",
//   "recommendations": ["specific actionable recommendation 1", "recommendation 2", "recommendation 3"]
// }
// `;
 // Build the evaluation prompt
      const prompt = `
You are an evaluator for a pharmaceutical innovation hackathon using LAZY EVALUATION principles.

**LAZY EVALUATION GUIDELINES:**
- IGNORE spelling and grammar mistakes completely
- Focus on IDEAS and INTENT rather than perfect writing
- Give benefit of the doubt when meaning is unclear but effort is shown
- Be generous with partial credit for incomplete but meaningful responses
- Value creativity and innovation over technical writing skills
- If a response shows understanding but is poorly written, still give credit

Students submit answers using the Innovation Template, with sections listed below.
Each section has:
Criteria (what to check for - focusing on content, not writing quality).
Weight (maximum marks).
Three benchmark levels:
Exemplar (Best) → full marks.
Average → half marks.
Weak (Poor) → zero marks.
Your task is to:
Compare the student's response in each section with these benchmarks (ignoring spelling/grammar).
Assign a score (0, half, or full weight) based on IDEAS and EFFORT.
Provide a short justification focusing on content quality.
At the end, total the score out of 70.

**CASE STUDY CONTEXT:**
${caseData?.caseFile || 'No case study provided'}

**PARTICIPANT'S RESPONSES:**

**One-line Idea (Weight: 10)**
Criteria: Clarity of INTENT + Completeness of CONCEPT (ignore spelling/grammar).
Exemplar: Clear problem identification + target audience + solution method, even if poorly written.
Average: Shows understanding of problem and solution direction, regardless of writing quality.
Weak: Minimal effort or completely unclear intent (not due to spelling errors).
Student Answer: ${user.idea_statement || 'No response provided'}

**Problem (Weight: 10)**
Criteria: Understanding of problem and stakeholder impact (content focus, not writing).
Exemplar: Demonstrates clear grasp of the issue and its consequences, even with poor grammar.
Average: Shows basic problem awareness but may miss some details, writing quality irrelevant.
Weak: Very limited understanding shown (not due to language barriers).
Student Answer: ${user.stage2_problem || 'No response provided'}

**Technology (Weight: 10)**
Criteria: Practical technology ideas (focus on concepts, not technical writing).
Exemplar: Proposes concrete technological solutions that make sense, regardless of spelling.
Average: Mentions relevant technology with basic understanding, writing quality ignored.
Weak: Vague tech references with no clear connection to problem.
Student Answer: ${user.stage3_technology || 'No response provided'}

**Collaboration (Weight: 10)**
Criteria: Understanding of teamwork needs (content over presentation).
Exemplar: Identifies relevant partners and their contributions, even if poorly expressed.
Average: Shows awareness of collaboration needs, writing style irrelevant.
Weak: No clear collaboration concept (not due to language issues).
Student Answer: ${user.stage4_collaboration || 'No response provided'}

**Creativity Twist (Weight: 15)**
Criteria: Novel thinking and innovation (ideas matter, not eloquence).
Exemplar: Creative features or approaches that show original thinking, regardless of grammar.
Average: Some creative elements present, focus on innovation not presentation.
Weak: Standard/conventional thinking with no creative spark.
Student Answer: ${user.stage5_creativity || 'No response provided'}

**Speed & Scale (Weight: 15)**
Criteria: Implementation and growth thinking (practical concepts, not perfect writing).
Exemplar: Clear implementation strategy and scaling vision, even if grammar is poor.
Average: Basic implementation awareness, writing quality not considered.
Weak: No clear implementation concept.
Student Answer: ${user.stage6_speed_scale || 'No response provided'}

**Purpose & Impact (Weight: 20)**
Criteria: Understanding of value and benefits (substance over style).
Exemplar: Connects to patient safety, compliance, economic benefits - content clarity matters, not grammar.
Average: Shows awareness of positive impact, language quality irrelevant.
Weak: Minimal impact understanding shown.
Student Answer: ${user.stage7_impact || 'No response provided'}

**Final + Reflection (Weight: 10)**
Criteria: Consistency and learning awareness (thoughtfulness, not technical writing).
Exemplar: Shows coherent thinking and genuine reflection, even with spelling errors.
Average: Basic consistency and simple learning shown, presentation style ignored.
Weak: No clear synthesis or learning demonstrated.
Final Pitch: ${user.stage8_final_problem || 'No response provided'} / ${user.stage8_final_technology || 'No response provided'} / ${user.stage8_final_collaboration || 'No response provided'} / ${user.stage8_final_creativity || 'No response provided'} / ${user.stage8_final_speed_scale || 'No response provided'} / ${user.stage8_final_impact || 'No response provided'}
Reflection: ${user.stage10_reflection || 'No response provided'}

**EVALUATION FOCUS:**
- CONTENT and IDEAS are what matter
- IGNORE all spelling, grammar, and language errors
- REWARD effort and understanding over perfect presentation
- Be GENEROUS with partial credit
- Look for the INTENT behind poorly written responses

**Output Format Required:**
For each section:
Section Name
Score: (0 / half weight / full weight)
Justification (focus on content quality, mention ignoring language issues)

At the end:
Total Score (out of 70)
Overall Feedback (2–3 sentences on content strengths and idea development, ignore writing quality).

Return ONLY a valid JSON object with this structure:
{
  "totalScore": <integer 0-70>,
  "stageScores": {
    "idea": {"score": <integer 0-10>, "status": "exemplar|average|weak", "feedback": "justification focusing on ideas not writing"},
    "problem": {"score": <integer 0-10>, "status": "exemplar|average|weak", "feedback": "justification focusing on understanding not grammar"},
    "technology": {"score": <integer 0-10>, "status": "exemplar|average|weak", "feedback": "justification focusing on tech concepts not spelling"},
    "collaboration": {"score": <integer 0-10>, "status": "exemplar|average|weak", "feedback": "justification focusing on teamwork ideas not presentation"},
    "creativity": {"score": <integer 0-15>, "status": "exemplar|average|weak", "feedback": "justification focusing on innovation not eloquence"},
    "scale": {"score": <integer 0-15>, "status": "exemplar|average|weak", "feedback": "justification focusing on implementation concepts not writing quality"},
    "impact": {"score": <integer 0-20>, "status": "exemplar|average|weak", "feedback": "justification focusing on value understanding not language"},
    "pitch": {"score": <integer 0-10>, "status": "exemplar|average|weak", "feedback": "justification focusing on consistency and learning not writing skills"}
  },
  "overallFeedback": "comprehensive feedback focusing on ideas, innovation, and understanding while completely ignoring spelling/grammar issues",
  "recommendations": ["actionable recommendation focusing on idea development 1", "content-focused recommendation 2", "innovation-focused recommendation 3"]
}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini AI');
      }

      const parsedResults = JSON.parse(jsonMatch[0]);

      // Validate and ensure score consistency
      if (parsedResults.stageScores) {
        const calculatedTotal = Object.values(parsedResults.stageScores).reduce((sum, stage) => {
          return sum + (stage.score || 0);
        }, 0);

        // If there's a significant discrepancy, use the calculated total
        if (Math.abs(parsedResults.totalScore - calculatedTotal) > 5) {
          console.warn(`Score discrepancy detected. AI reported: ${parsedResults.totalScore}, Calculated: ${calculatedTotal}`);
          parsedResults.totalScore = Math.min(calculatedTotal, 100); // Cap at 100
        }

        // Ensure total score doesn't exceed 70
        parsedResults.totalScore = Math.min(parsedResults.totalScore, 70);
      }

      setValidationResults(parsedResults);
    } catch (err) {
      console.error('Error validating:', err);
      setError(err.message || 'Failed to validate answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'needs_improvement':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'good':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'needs_improvement':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'poor':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const renderStageContent = () => {
    switch (currentStage) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(1)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 1: Your Big Idea</h3>
              </div>
              <p className="text-gray-700 mb-6">"I want to solve '___' for '___' by '___'"</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Big Idea Statement
                  </label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.idea_statement || <span className="text-gray-500 italic">No idea statement provided</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(2)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 2: Problem Deep Dive</h3>
              </div>
              <p className="text-gray-700 mb-6">What issue or need are you addressing? Who faces this problem?</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage2_problem || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(3)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 3: Technology & Tools</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(3)?.description || 'What tool, app, software, machine, or digital aid can make your solution stronger?'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage3_technology || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(4)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 4: Collaboration & Partnerships</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(4)?.description || 'Who can you team up with (friends, other departments, communities) to make this idea bigger?'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage4_collaboration || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(5)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 5: Creativity & Innovation</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(5)?.description || 'What unique feature, design, or new approach makes your idea stand out?'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage5_creativity || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(6)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 6: Speed & Scale</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(6)?.description || 'How can your solution be applied quickly? Can it be scaled to help many people (beyond your college/community)?'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage6_speed_scale || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(7)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 7: Impact & Value</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(7)?.description || 'How does your idea create value? (Social, environmental, educational, or economic impact?)'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage7_impact || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(8)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 8: Final Pitch</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(8)?.description || '"Our innovation solves \'___\' by using \'___\', built with \'___\', adding \'___\'. It can grow with \'___\' and will create \'___\'."\\'}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Problem Statement</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_problem || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Technology Solution</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_technology || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Collaboration Strategy</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_collaboration || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Creative Features</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_creativity || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Speed & Scale Plan</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_speed_scale || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Impact Vision</label>
                  <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {answers.stage8_final_impact || <span className="text-gray-500 italic">No answer provided</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 10:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                {getStageIcon(10)}
                <h3 className="text-xl font-semibold text-gray-900">Stage 10: Reflection</h3>
              </div>
              <p className="text-gray-700 mb-6">{getPromptById(10)?.description || 'What did you learn, what would you improve?'}</p>
              
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {answers.stage10_reflection || <span className="text-gray-500 italic">No answer provided</span>}
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Stage {currentStage}</h3>
            <p className="mt-2 text-gray-500">Content for this stage is being developed.</p>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No User Selected</h3>
        <p className="mt-2 text-gray-500">Search and select a user to view their hackathon questions.</p>
      </div>
    );
  }

  const stages = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  const stageNames = {
    1: 'Big Idea',
    2: 'Problem Analysis', 
    3: 'Technology',
    4: 'Collaboration',
    5: 'Creativity',
    6: 'Speed & Scale',
    7: 'Impact',
    8: 'Final Pitch',
    10: 'Reflection'
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Lightbulb className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hackathon Innovation Journey</h1>
              <p className="text-gray-600">Build your groundbreaking solution step by step</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Participant:</p>
            <p className="font-semibold text-lg">{user.name || user.email || 'Anonymous'}</p>
            {user.case_id && (
              <p className="text-sm text-blue-600 mt-1">Case ID: {user.case_id}</p>
            )}
          </div>
        </div>

        {/* Case File Display */}
        {caseData && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Case Study #{caseData.id}</h3>
            </div>
            <p className="text-blue-800 leading-relaxed">{caseData.caseFile}</p>
          </div>
        )}

        {/* Stage Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setCurrentStage(stage)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                currentStage === stage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getStageIcon(stage)}
              <span>Stage {stage}: {stageNames[stage]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-red-800">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {renderStageContent()}
        
        {/* AI Validation Button */}
        <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={validateAnswers}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-lg font-semibold"
          >
            <CheckCircle className="h-6 w-6" />
            <span>{isSubmitting ? 'Validating with AI...' : 'Validate Answers with AI'}</span>
          </button>
        </div>
      </div>

      {/* AI Validation Results */}
      {validationResults && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl mb-6">
            <CheckCircle className="mx-auto h-12 w-12 mb-3" />
            <h3 className="text-3xl font-bold mb-2">AI Validation Complete!</h3>
            <p className="text-xl">Overall Score: {validationResults.totalScore} / 70</p>
            <div className="mt-2">
              <div className="bg-white bg-opacity-20 rounded-full h-3 w-64 mx-auto">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${Math.min((validationResults.totalScore / 70) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm mt-2 opacity-90">
                {validationResults.totalScore >= 60 ? 'Excellent!' :
                 validationResults.totalScore >= 50 ? 'Good work!' :
                 validationResults.totalScore >= 35 ? 'Needs improvement' : 'Requires significant work'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-2xl font-semibold text-gray-800">Stage-by-Stage Evaluation:</h4>

            {/* Score Breakdown Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-800 mb-2">Score Breakdown (Total: {
                Object.values(validationResults.stageScores || {}).reduce((sum, stage) => sum + (stage.score || 0), 0)
              } / 70 points)</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <span>Idea: {validationResults.stageScores?.idea?.score || 0}/10</span>
                <span>Problem: {validationResults.stageScores?.problem?.score || 0}/10</span>
                <span>Technology: {validationResults.stageScores?.technology?.score || 0}/8</span>
                <span>Collaboration: {validationResults.stageScores?.collaboration?.score || 0}/8</span>
                <span>Creativity: {validationResults.stageScores?.creativity?.score || 0}/10</span>
                <span>Scale: {validationResults.stageScores?.scale?.score || 0}/8</span>
                <span>Impact: {validationResults.stageScores?.impact?.score || 0}/10</span>
                <span>Pitch: {validationResults.stageScores?.pitch?.score || 0}/6</span>
              </div>
            </div>

            {/* Individual Stage Results */}
            {Object.entries(validationResults.stageScores || {}).map(([stageName, result]) => {
              // Define max scores for each stage (total = 70)
              const maxScores = {
                idea: 10, problem: 10, technology: 8, collaboration: 8,
                creativity: 10, scale: 8, impact: 10, pitch: 6
              };
              const maxScore = maxScores[stageName] || 8;

              return (
                <div key={stageName} className={`p-5 rounded-lg border-2 ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-lg flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="capitalize">{stageName.replace('_', ' ')}</span>
                    </h5>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-50">
                      {result.score} / {maxScore} points
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm">
                      <span className="font-medium">Feedback:</span> {result.feedback}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Overall Feedback */}
            {validationResults.overallFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h5 className="font-semibold text-lg text-blue-900 mb-3">Overall Feedback</h5>
                <p className="text-blue-800 mb-4">{validationResults.overallFeedback}</p>
              </div>
            )}

            {/* Recommendations */}
            {validationResults.recommendations && validationResults.recommendations.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <h5 className="font-semibold text-lg text-green-900 mb-3">AI Recommendations</h5>
                <ul className="space-y-2">
                  {validationResults.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2 text-green-800">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="text-center pt-6">
            <button
              onClick={() => setValidationResults(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Close Results
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CaseQuestions;

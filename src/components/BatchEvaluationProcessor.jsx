import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AlertTriangle, BarChart, CheckCircle, Clock, Database, XCircle } from 'lucide-react';
import { hackathonData } from '../data/HackathonData';
import { checkEvaluationExists, logProcessEvent, saveEvaluationError, saveEvaluationResults, testLogInsertion, debugProcessLogs } from '../lib/databaseService';

const BatchEvaluationProcessor = ({ users, onComplete }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, complete, error
  const [completedUsers, setCompletedUsers] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [processedUsersCount, setProcessedUsersCount] = useState(0);
  const [sessionId, setSessionId] = useState(null); // Session ID for logging
  const BATCH_SIZE = 5;

  // Load completed users from LocalStorage on component mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('completed_users');
    if (savedUsers) {
      try {
        setCompletedUsers(JSON.parse(savedUsers));
      } catch (error) {
        console.error('Error loading completed users from LocalStorage:', error);
        setCompletedUsers([]);
      }
    }
  }, []);

  const saveUserToLocalStorage = (email, totalScore) => {
    const userRecord = {
      email,
      totalScore,
      finishedAt: new Date().toISOString()
    };

    const updatedCompletedUsers = [...completedUsers, userRecord];
    setCompletedUsers(updatedCompletedUsers);
    
    try {
      localStorage.setItem('completed_users', JSON.stringify(updatedCompletedUsers));
      console.log(`Saved user ${email} with score ${totalScore} to LocalStorage`);
    } catch (error) {
      console.error('Error saving to LocalStorage:', error);
    }
  };





  const getCaseData = (caseId) => {
    return hackathonData.find(item => item.id === parseInt(caseId));
  };

  const getPromptById = (stageId) => {
    // This is a simplified mapping - in a real app, this would come from a prompts database
    const prompts = {
      2: { description: "What issue or need are you addressing? Who faces this problem?" },
      3: { description: "What tool, app, software, machine, or digital aid can make your solution stronger?" },
      4: { description: "Who can you team up with to make this idea bigger?" },
      5: { description: "What unique feature, design, or new approach makes your idea stand out?" },
      6: { description: "How can your solution be applied quickly and scaled?" },
      7: { description: "How does your idea create value?" },
      8: { description: "Our innovation solves ___ by using ___, built with ___, adding ___. It can grow with ___ and will create ___." },
      10: { description: "What did you learn, what would you improve?" }
    };
    return prompts[stageId];
  };

  const evaluateUser = async (user) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Please set VITE_GEMINI_API_KEY in your .env.local file');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Get case data
      const caseData = getCaseData(user.case_id || user.selected_case_id);

      // Build the evaluation prompt
      const prompt = `
You are evaluating hackathon innovation responses based on a specific case study scenario.

**IMPORTANT EVALUATION RULES:**
- The CASE STUDY below is the PRIMARY context that all participant responses should address
- All subsequent questions (Stages 1-10) are SUBQUESTIONS that should relate to and build upon the case study scenario
- Evaluate how well each response connects to and addresses the specific case study context
- Score higher for responses that demonstrate understanding of the case study and provide relevant, contextual solutions

**CASE STUDY (PRIMARY EVALUATION CONTEXT):**
${caseData?.caseFile || 'No case study provided'}

**PARTICIPANT'S RESPONSES TO SUBQUESTIONS:**

**Stage 1 - YOUR INNOVATION IDEA:**
Question: "I want to solve '___' for '___' by '___'"
Answer: ${user.idea_statement || 'No response provided'}

**Stage 2 - Problem Analysis:**
Question: "${getPromptById(2)?.description || 'What issue or need are you addressing? Who faces this problem?'}"
Answer: ${user.stage2_problem || 'No response provided'}

**Stage 3 - Technology:**
Question: "${getPromptById(3)?.description || 'What tool, app, software, machine, or digital aid can make your solution stronger?'}"
Answer: ${user.stage3_technology || 'No response provided'}

**Stage 4 - Collaboration:**
Question: "${getPromptById(4)?.description || 'Who can you team up with to make this idea bigger?'}"
Answer: ${user.stage4_collaboration || 'No response provided'}

**Stage 5 - Creativity:**
Question: "${getPromptById(5)?.description || 'What unique feature, design, or new approach makes your idea stand out?'}"
Answer: ${user.stage5_creativity || 'No response provided'}

**Stage 6 - Speed & Scale:**
Question: "${getPromptById(6)?.description || 'How can your solution be applied quickly and scaled?'}"
Answer: ${user.stage6_speed_scale || 'No response provided'}

**Stage 7 - Impact:**
Question: "${getPromptById(7)?.description || 'How does your idea create value?'}"
Answer: ${user.stage7_impact || 'No response provided'}

**Stage 8 - Final Pitch:**
Question: "${getPromptById(8)?.description || 'Our innovation solves ___ by using ___, built with ___, adding ___. It can grow with ___ and will create ___.'}'"
Final Problem: ${user.stage8_final_problem || 'No response provided'}
Final Technology: ${user.stage8_final_technology || 'No response provided'}
Final Collaboration: ${user.stage8_final_collaboration || 'No response provided'}
Final Creativity: ${user.stage8_final_creativity || 'No response provided'}
Final Speed & Scale: ${user.stage8_final_speed_scale || 'No response provided'}
Final Impact: ${user.stage8_final_impact || 'No response provided'}

**Stage 10 - Reflection:**
Question: "${getPromptById(10)?.description || 'What did you learn, what would you improve?'}"
Answer: ${user.stage10_reflection || 'No response provided'}

**EVALUATION CRITERIA:**
Please evaluate based on:
1. **CASE STUDY RELEVANCE** - How well do the responses address the specific case study scenario? (HIGHEST PRIORITY)
2. **CONTEXTUAL UNDERSTANDING** - Does the participant demonstrate understanding of the case study context and constraints?
3. Completeness and depth of responses
4. Innovation and creativity within the case study context
5. Feasibility and practicality of solutions for the case study scenario
6. Potential impact and scalability relevant to the case study
7. Coherence between stages and consistency with the case study
8. Quality of reflection and learning from the case study experience

Return ONLY a valid JSON object with this structure:
{
  "totalScore": <integer 0-100>,
  "stageScores": {
    "idea": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "problem": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "technology": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "collaboration": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "creativity": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "scale": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "impact": {"score": <integer 0-15>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"},
    "pitch": {"score": <integer 0-10>, "status": "excellent|good|needs_improvement|poor", "feedback": "specific feedback"}
  },
  "overallFeedback": "comprehensive feedback with strengths, areas for improvement, and suggestions",
  "recommendations": ["specific actionable recommendation 1", "recommendation 2", "recommendation 3"]
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
      return parsedResults;
    } catch (error) {
      console.error(`Error evaluating user ${user.email}:`, error);
      throw error;
    }
  };

  const getCurrentBatch = () => {
    const startIndex = currentBatchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, users.length);
    return users.slice(startIndex, endIndex);
  };

  const hasMoreBatches = () => {
    return (currentBatchIndex + 1) * BATCH_SIZE < users.length;
  };

  const processCurrentBatch = async () => {
    if (users.length === 0) {
      alert('No users to process');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('processing');

    const currentBatch = getCurrentBatch();
    const batchStartIndex = currentBatchIndex * BATCH_SIZE;
    const totalBatches = Math.ceil(users.length / BATCH_SIZE);
    
    // Generate a unique batch ID for database tracking
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchStartTime = Date.now();

    console.log(`Starting Batch ${currentBatchIndex + 1}/${totalBatches} (Users ${batchStartIndex + 1}-${batchStartIndex + currentBatch.length}) - Batch ID: ${batchId}`);

    // Log batch start
    if (sessionId) {
      await logProcessEvent({
        sessionId,
        batchId,
        batchNumber: currentBatchIndex + 1,
        totalBatches,
        logLevel: 'INFO',
        logType: 'BATCH_START',
        message: `Starting batch ${currentBatchIndex + 1}/${totalBatches} with ${currentBatch.length} users`,
        totalUsers: currentBatch.length,
        totalSessionUsers: users.length,
        details: {
          batchUsers: currentBatch.map(u => u.email),
          batchStartIndex: batchStartIndex + 1,
          batchEndIndex: batchStartIndex + currentBatch.length
        },
        startedAt: new Date().toISOString()
      });
    }
    // Process current batch
    for (let i = 0; i < currentBatch.length; i++) {
      const user = currentBatch[i];
      const globalIndex = batchStartIndex + i;
      const userStartTime = Date.now();
      setCurrentUserIndex(globalIndex);

      // Log user processing start
      if (sessionId) {
        await logProcessEvent({
          sessionId,
          batchId,
          batchNumber: currentBatchIndex + 1,
          email: user.email,
          userIndex: i + 1,
          totalUsers: currentBatch.length,
          globalUserIndex: globalIndex + 1,
          totalSessionUsers: users.length,
          logLevel: 'INFO',
          logType: 'USER_PROCESSING_START',
          message: `Starting evaluation for user ${globalIndex + 1}/${users.length}: ${user.email}`,
          details: {
            userCaseId: user.case_id || user.selected_case_id,
            batchPosition: i + 1,
            globalPosition: globalIndex + 1
          },
          startedAt: new Date().toISOString()
        });
      }

      try {
        console.log(`Processing user ${globalIndex + 1}/${users.length}: ${user.email} (Batch ${currentBatchIndex + 1}, User ${i + 1}/${currentBatch.length})`);

        // Check if evaluation already exists for this email
        const existingCheck = await checkEvaluationExists(user.email);
        
        if (existingCheck.error) {
          console.warn(`Error checking existing evaluation for ${user.email}:`, existingCheck.error);
          
          // Log warning
          if (sessionId) {
            await logProcessEvent({
              sessionId,
              batchId,
              email: user.email,
              logLevel: 'WARN',
              logType: 'DUPLICATE_CHECK_ERROR',
              message: `Error checking existing evaluation for ${user.email}`,
              errorMessage: existingCheck.error,
              dbSaveAttempted: false, // No save attempted due to check error
              dbSaveSuccessful: false,
              details: { checkError: existingCheck.error }
            });
          }
          // Continue with processing despite check error
        } else if (existingCheck.exists) {
          const processingDuration = Date.now() - userStartTime;
          console.log(`Skipping ${user.email} - evaluation already exists with score: ${existingCheck.data.total_score}`);
          
          // Log user skip
          if (sessionId) {
            await logProcessEvent({
              sessionId,
              batchId,
              email: user.email,
              userIndex: i + 1,
              globalUserIndex: globalIndex + 1,
              logLevel: 'INFO',
              logType: 'USER_SKIPPED',
              message: `Skipped ${user.email} - evaluation already exists`,
              processingStatus: 'skipped',
              totalScore: existingCheck.data.total_score,
              processingDurationMs: processingDuration,
              dbSaveAttempted: false, // No save attempted since already exists
              dbSaveSuccessful: false, // No save needed
              details: {
                reason: 'Already evaluated',
                existingScore: existingCheck.data.total_score,
                existingProcessedAt: existingCheck.data.processed_at
              },
              completedAt: new Date().toISOString()
            });
          }
          
          // Add to results as already processed
          const userResult = {
            email: user.email,
            totalScore: existingCheck.data.total_score,
            status: 'skipped',
            finishedAt: existingCheck.data.processed_at,
            skippedReason: 'Already evaluated',
            savedToDatabase: true
          };

          setEvaluationResults(prev => [...prev, userResult]);
          setProcessedUsersCount(prev => prev + 1);
          
          // Small delay before next user
          if (i < currentBatch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          continue; // Skip to next user
        }

        const evaluationResult = await evaluateUser(user);
        const processingDuration = Date.now() - userStartTime;

        // Save to LocalStorage immediately after successful evaluation
        saveUserToLocalStorage(user.email, evaluationResult.totalScore);

        // Save to database
        let dbSaveSuccessful = false;
        let dbErrorMessage = null;
        try {
          const dbResult = await saveEvaluationResults({
            email: user.email,
            user_id: user.user_id,
            case_id: user.case_id || user.selected_case_id,
            aiResults: evaluationResult,
            batchId: batchId
          });
          
          if (dbResult.error) {
            console.error(`Database save failed for ${user.email}:`, dbResult.error);
            dbErrorMessage = dbResult.error;
          } else {
            console.log(`Successfully saved ${user.email} evaluation to database`);
            dbSaveSuccessful = true;
          }
        } catch (dbError) {
          console.error(`Database save error for ${user.email}:`, dbError);
          dbErrorMessage = dbError.message;
        }

        // Log successful user processing
        if (sessionId) {
          await logProcessEvent({
            sessionId,
            batchId,
            email: user.email,
            userIndex: i + 1,
            globalUserIndex: globalIndex + 1,
            logLevel: 'INFO',
            logType: 'USER_SUCCESS',
            message: `Successfully processed ${user.email} with score ${evaluationResult.totalScore}`,
            processingStatus: 'success',
            totalScore: evaluationResult.totalScore,
            processingDurationMs: processingDuration,
            apiCallsMade: 1, // One Gemini API call
            dbSaveAttempted: true,
            dbSaveSuccessful,
            dbErrorMessage,
            details: {
              stageScores: evaluationResult.stageScores,
              overallFeedback: evaluationResult.overallFeedback?.substring(0, 200) + '...', // Truncate for logging
              recommendationsCount: evaluationResult.recommendations?.length || 0
            },
            aiModel: 'gemini-2.0-flash-exp',
            completedAt: new Date().toISOString()
          });
        }

        // Store result for display
        const userResult = {
          email: user.email,
          totalScore: evaluationResult.totalScore,
          status: 'success',
          finishedAt: new Date().toISOString(),
          fullResults: evaluationResult,
          savedToDatabase: true // Flag to indicate database save attempt
        };

        setEvaluationResults(prev => [...prev, userResult]);
        setProcessedUsersCount(prev => prev + 1);

        console.log(`Successfully processed ${user.email} with score ${evaluationResult.totalScore}`);

        // Small delay between users to prevent rate limiting
        if (i < currentBatch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        const processingDuration = Date.now() - userStartTime;
        console.error(`Failed to process user ${user.email}:`, error);

        // Save error to database
        let dbSaveSuccessful = false;
        let dbErrorMessage = null;
        try {
          const dbResult = await saveEvaluationError({
            email: user.email,
            user_id: user.user_id,
            case_id: user.case_id || user.selected_case_id,
            error_message: error.message,
            batchId: batchId
          });
          
          if (dbResult.error) {
            console.error(`Database error save failed for ${user.email}:`, dbResult.error);
            dbErrorMessage = dbResult.error;
          } else {
            console.log(`Successfully saved error for ${user.email} to database`);
            dbSaveSuccessful = true;
          }
        } catch (dbError) {
          console.error(`Database error save failed for ${user.email}:`, dbError);
          dbErrorMessage = dbError.message;
        }

        // Log user error
        if (sessionId) {
          await logProcessEvent({
            sessionId,
            batchId,
            email: user.email,
            userIndex: i + 1,
            globalUserIndex: globalIndex + 1,
            logLevel: 'ERROR',
            logType: 'USER_ERROR',
            message: `Failed to process ${user.email}: ${error.message}`,
            processingStatus: 'error',
            totalScore: 0,
            processingDurationMs: processingDuration,
            errorMessage: error.message,
            errorCode: error.code || 'UNKNOWN',
            stackTrace: error.stack,
            dbSaveAttempted: true,
            dbSaveSuccessful,
            dbErrorMessage,
            details: {
              errorType: error.constructor.name,
              isApiError: error.message.includes('API') || error.message.includes('Gemini'),
              isNetworkError: error.message.includes('network') || error.message.includes('fetch')
            },
            completedAt: new Date().toISOString()
          });
        }

        const userResult = {
          email: user.email,
          totalScore: 0,
          status: 'error',
          error: error.message,
          finishedAt: new Date().toISOString(),
          savedToDatabase: true // Flag to indicate database save attempt
        };

        setEvaluationResults(prev => [...prev, userResult]);
        setProcessedUsersCount(prev => prev + 1);
      }
    }

    const batchDuration = Date.now() - batchStartTime;
    console.log(`Completed Batch ${currentBatchIndex + 1}/${totalBatches}`);

    // Log batch completion
    if (sessionId) {
      const successCount = evaluationResults.filter(r => r.status === 'success').length;
      const skippedCount = evaluationResults.filter(r => r.status === 'skipped').length;
      const errorCount = evaluationResults.filter(r => r.status === 'error').length;

      await logProcessEvent({
        sessionId,
        batchId,
        batchNumber: currentBatchIndex + 1,
        totalBatches,
        logLevel: 'INFO',
        logType: 'BATCH_COMPLETE',
        message: `Completed batch ${currentBatchIndex + 1}/${totalBatches} - ${successCount} success, ${skippedCount} skipped, ${errorCount} errors`,
        totalUsers: currentBatch.length,
        processingDurationMs: batchDuration,
        details: {
          batchResults: {
            total: currentBatch.length,
            successful: successCount,
            skipped: skippedCount,
            errors: errorCount
          },
          avgProcessingTimePerUser: Math.round(batchDuration / currentBatch.length)
        },
        completedAt: new Date().toISOString()
      });
    }

    setIsProcessing(false);

    // Current batch completed
    setProcessingStatus('complete');
    setIsComplete(true);

    console.log(`Batch ${currentBatchIndex + 1} completed! Processed ${currentBatch.length} users.`);

    // Log session completion
    if (sessionId) {
      const totalSuccessful = evaluationResults.filter(r => r.status === 'success').length;
      const totalSkipped = evaluationResults.filter(r => r.status === 'skipped').length;
      const totalErrors = evaluationResults.filter(r => r.status === 'error').length;
      const avgScore = evaluationResults
        .filter(r => r.status === 'success' || r.status === 'skipped')
        .reduce((sum, r) => sum + r.totalScore, 0) / 
        (totalSuccessful + totalSkipped || 1);

      await logProcessEvent({
        sessionId,
        logLevel: 'INFO',
        logType: 'SESSION_COMPLETE',
        message: `Session completed - processed ${users.length} users: ${totalSuccessful} successful, ${totalSkipped} skipped, ${totalErrors} errors`,
        totalSessionUsers: users.length,
        details: {
          sessionSummary: {
            totalUsers: users.length,
            successful: totalSuccessful,
            skipped: totalSkipped,
            errors: totalErrors,
            averageScore: Math.round(avgScore),
            totalBatches: Math.ceil(users.length / BATCH_SIZE)
          },
          performance: {
            totalProcessingTime: Date.now() - new Date(evaluationResults[0]?.finishedAt || new Date()).getTime(),
            avgTimePerUser: 'calculated_by_db_view'
          }
        },
        completedAt: new Date().toISOString()
      });
    }

    if (onComplete) {
      onComplete();
    }
  };

  const startBatchProcessing = async () => {
    // Generate unique session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    // Test log insertion first
    console.log('Testing log insertion...');
    const testResult = await testLogInsertion();
    console.log('Test result:', testResult);
    
    // Debug existing logs
    console.log('Debugging existing logs...');
    const debugResult = await debugProcessLogs();
    console.log('Debug result:', debugResult);

    // Log session start
    await logProcessEvent({
      sessionId: newSessionId,
      logLevel: 'INFO',
      logType: 'SESSION_START',
      message: `Starting batch evaluation session for ${users.length} users`,
      totalSessionUsers: users.length,
      details: {
        totalUsers: users.length,
        batchSize: BATCH_SIZE,
        totalBatches: Math.ceil(users.length / BATCH_SIZE),
        userEmails: users.map(u => u.email)
      },
      startedAt: new Date().toISOString()
    });

    // Reset everything for a fresh start
    setEvaluationResults([]);
    setProcessedUsersCount(0);
    setCurrentBatchIndex(0);
    setIsComplete(false);

    // Start processing the first batch
    await processCurrentBatch();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'skipped':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getProgressPercentage = () => {
    if (users.length === 0) return 0;
    return Math.round((processedUsersCount / users.length) * 100);
  };

  const getCurrentBatchInfo = () => {
    const startIndex = currentBatchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, users.length);
    return {
      batchNumber: currentBatchIndex + 1,
      totalBatches: Math.ceil(users.length / BATCH_SIZE),
      batchStart: startIndex + 1,
      batchEnd: endIndex,
      batchSize: endIndex - startIndex
    };
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Available</h3>
          <p className="text-gray-600">Please search for users first to start batch processing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Batch Evaluation Processor</h2>
              <p className="text-gray-600">
                Processing current batch of {users.length} users
                {processedUsersCount > 0 && ` (${processedUsersCount}/${users.length} completed)`}
              </p>
              {isProcessing && (
                <p className="text-sm text-blue-600">
                  Processing batch of {users.length} users...
                </p>
              )}
            </div>
          </div>

          {!isProcessing && !isComplete && (
            <div className="flex space-x-3">
              <button
                onClick={startBatchProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Start Batch Evaluation
              </button>
              <button
                onClick={async () => {
                  console.log('Testing database logging...');
                  const testResult = await testLogInsertion();
                  const debugResult = await debugProcessLogs();
                  alert(`Test: ${testResult.success ? 'Success' : 'Failed: ' + testResult.error}`);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Test Logging
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(isProcessing || isComplete || processedUsersCount > 0) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {processedUsersCount} of {users.length} users processed
              </span>
              <span className="text-sm font-medium text-gray-700">
                {getProgressPercentage()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

          </div>
        )}

        {/* Currently Processing */}
        {isProcessing && currentUserIndex < users.length && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div className="font-medium text-blue-900">
                <div>Currently processing: {users[currentUserIndex]?.email}</div>
                <div className="text-sm text-blue-700">
                  User {currentUserIndex + 1} of {users.length} in current batch
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Results List */}
      {evaluationResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Results:</h3>
          
          {evaluationResults.map((result, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'skipped'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="font-medium text-gray-900">{result.email}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>User {index + 1} of {users.length}</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(result.finishedAt).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {result.status === 'success' ? (
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Score: {result.totalScore}/100
                  </div>
                ) : result.status === 'skipped' ? (
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Skipped (Score: {result.totalScore}/100)
                  </div>
                ) : (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Failed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Results Summary */}
      {isComplete && (
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 mb-3" />
            <h3 className="text-2xl font-bold mb-2">Batch Processing Complete!</h3>
            <p className="text-lg mb-4">
              Successfully processed {evaluationResults.filter(r => r.status === 'success').length} users,{' '}
              skipped {evaluationResults.filter(r => r.status === 'skipped').length} already evaluated users{' '}
              out of {users.length} total users
            </p>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Saved to Database & LocalStorage</span>
                </h4>
                <p className="text-sm opacity-90">All evaluation results have been saved to the evaluation_results table</p>
              </div>
              <div className="text-sm space-y-1">
                {evaluationResults
                  .filter(r => r.status === 'success' || r.status === 'skipped')
                  .map((result, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{result.email} {result.status === 'skipped' ? '(skipped)' : ''}</span>
                      <span>Score: {result.totalScore}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchEvaluationProcessor;

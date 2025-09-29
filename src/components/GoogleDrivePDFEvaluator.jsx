import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Set the worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const GoogleDrivePDFEvaluator = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);

  // Function to load the Google Identity Services script
  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (document.getElementById('google-drive-script')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-drive-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Function to load Google Drive API
  const loadGapi = () => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Function to initialize Google Drive client
  const initializeGoogleClient = async () => {
    try {
      await loadGoogleScript();
      await loadGapi();
      setGapiLoaded(true);
      
      // Wait a bit for the script to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!window.google || !window.google.accounts) {
        throw new Error('Google Identity Services failed to load');
      }
      
      return true;
    } catch (error) {
      throw new Error('Failed to load Google Identity Services: ' + error.message);
    }
  };

  // Function to connect to Google Drive
  const connectToGoogleDrive = async () => {
    setIsProcessing(true);
    setProcessingStatus('Initializing Google Drive connection...');
    
    try {
      // Initialize Google client
      await initializeGoogleClient();
      
      // Get Google Drive client ID from environment variables
      const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Google Drive Client ID not found. Please set VITE_GOOGLE_DRIVE_CLIENT_ID in your .env file.');
      }
      
      // Request access token using Google Identity Services
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response) => {
          if (response.error) {
            setConnectionError(`Google Drive authentication error: ${response.error_description || response.error}`);
            setIsProcessing(false);
            setProcessingStatus('');
            return;
          }
          
          setAccessToken(response.access_token);
          setIsConnected(true);
          setProcessingStatus('Fetching files from Google Drive...');
          
          // Fetch files from the specific folder
          fetchFilesFromFolder(response.access_token);
        },
      });
      
      // Correctly request the token
      client.requestAccessToken();
    } catch (error) {
      setConnectionError(error.message);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to fetch files from a specific Google Drive folder
  const fetchFilesFromFolder = async (token) => {
    try {
      // The folder ID from your URL: https://drive.google.com/drive/folders/1IsUJV36Mi4WBJUjzOkK_bWqC79LQY7AiKLluNpOYnpo7ALlltXRs8y0sYarDbUn3WMA70LuI
      // The actual folder ID is: 1IsUJV36Mi4WBJUjzOkK_bWqC79LQY7Ai
      const folderId = '1IsUJV36Mi4WBJUjzOkK_bWqC79LQY7Ai';
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType = 'application/pdf'&fields=files(id,name,mimeType)&key=${import.meta.env.VITE_GOOGLE_DRIVE_API_KEY}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDriveFiles(data.files || []);
      setIsProcessing(false);
      setProcessingStatus('');
    } catch (error) {
      setConnectionError(`Failed to fetch files from Google Drive: ${error.message}`);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to disconnect from Google Drive
  const disconnectFromGoogleDrive = () => {
    setIsConnected(false);
    setDriveFiles([]);
    setSelectedFiles([]);
    setAccessToken(null);
    setConnectionError(null);
  };

  // Function to select files
  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  // Function to fetch PDF file as blob from Google Drive
  const fetchPDFBlobFromDrive = async (fileId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      throw new Error(`Failed to fetch PDF from Google Drive: ${error.message}`);
    }
  };

  // Function to extract text from PDF blob
  const extractTextFromPDF = async (pdfBlob) => {
    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }
      
      return fullText.trim();
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  // Function to evaluate content using the Gemini API
  const evaluateContent = async (content, fileName) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Please set VITE_GEMINI_API_KEY in your .env file');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Build the evaluation prompt (similar to BatchEvaluationProcessor)
      const prompt = `
You are an evaluator for a pharmaceutical innovation hackathon using LAZY EVALUATION principles.

**LAZY EVALUATION GUIDELINES:**
- IGNORE spelling and grammar mistakes completely
- Focus on IDEAS and INTENT rather than perfect writing
- Give benefit of the doubt when meaning is unclear but effort is shown
- Be generous with partial credit for incomplete but meaningful responses
- Value creativity and innovation over technical writing skills
- If a response shows understanding but is poorly written, still give credit

**STUDENT'S PDF CONTENT:**
${content}

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
      return parsedResults;
    } catch (error) {
      throw new Error(`Failed to evaluate content: ${error.message}`);
    }
  };

  // Function to evaluate selected PDFs
  const evaluatePDFs = async () => {
    if (selectedFiles.length === 0) {
      setConnectionError('Please select at least one PDF file to evaluate');
      return;
    }
    
    setIsProcessing(true);
    setEvaluationResults([]);
    setConnectionError(null);
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProcessingStatus(`Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}`);
        
        try {
          // Fetch PDF from Google Drive
          const pdfBlob = await fetchPDFBlobFromDrive(file.id);
          
          // Extract text from PDF
          const textContent = await extractTextFromPDF(pdfBlob);
          
          // Evaluate content
          const evaluation = await evaluateContent(textContent, file.name);
          results.push({
            fileName: file.name,
            ...evaluation
          });
        } catch (fileError) {
          results.push({
            fileName: file.name,
            error: fileError.message
          });
        }
      }
      
      setEvaluationResults(results);
      setProcessingStatus('');
      setIsProcessing(false);
    } catch (error) {
      setConnectionError('Failed to evaluate PDFs: ' + error.message);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to clear results
  const clearResults = () => {
    setEvaluationResults([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2 text-blue-600" />
          Google Drive PDF Evaluator
        </h2>
      </div>
      
      <div className="space-y-6">
        {/* Connection Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Connect to Google Drive</h3>
          
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-4">
              {connectionError && !isProcessing && (
                <div className="text-red-500 flex items-center mb-4">
                  <AlertCircle className="mr-2" />
                  {connectionError}
                </div>
              )}
              
              <button
                onClick={connectToGoogleDrive}
                disabled={isProcessing}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processingStatus || 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" />
                    Connect Google Drive
                  </>
                )}
              </button>
              
              <p className="text-sm text-gray-500 mt-3 text-center">
                Securely connect to your Google Drive to select PDF files for evaluation
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <CheckCircle className="mr-2" />
                Connected to Google Drive successfully
              </div>
              <button
                onClick={disconnectFromGoogleDrive}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <RefreshCw className="mr-1" size={16} />
                Disconnect
              </button>
            </div>
          )}
        </div>
        
        {/* File Selection Section */}
        {isConnected && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Select PDF Files</h3>
              <span className="text-sm text-gray-500">{selectedFiles.length} selected</span>
            </div>
            
            {driveFiles.length > 0 ? (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {driveFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                      selectedFiles.some(f => f.id === file.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleFileSelection(file)}
                  >
                    <div className="flex items-center flex-1">
                      <FileText className="text-red-500 mr-3" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mr-3">
                      PDF
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedFiles.some(f => f.id === file.id) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFiles.some(f => f.id === file.id) && (
                        <CheckCircle className="text-white" size={16} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No PDF files found in your Google Drive folder
              </div>
            )}
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={evaluatePDFs}
                  disabled={isProcessing}
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {processingStatus || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2" size={16} />
                      Evaluate Selected PDFs
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Processing Status */}
        {isProcessing && processingStatus && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>{processingStatus}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(selectedFiles.findIndex(f => f.name === processingStatus.split(': ')[1]) + 1) / selectedFiles.length * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Results Section */}
        {evaluationResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Evaluation Results</h3>
              <button
                onClick={clearResults}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Results
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluationResults.map((result, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-800 truncate">{result.fileName}</h4>
                    {result.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'exemplar' ? 'bg-green-100 text-green-800' :
                        result.status === 'average' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    )}
                  </div>
                  
                  {result.error ? (
                    <div className="mt-3 text-red-500 text-sm">
                      <AlertCircle className="inline mr-1" size={16} />
                      {result.error}
                    </div>
                  ) : (
                    <>
                      <div className="mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="font-bold text-lg">{result.totalScore}/70</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full bg-blue-600" 
                            style={{ width: `${(result.totalScore / 70) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">{result.overallFeedback}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDrivePDFEvaluator;
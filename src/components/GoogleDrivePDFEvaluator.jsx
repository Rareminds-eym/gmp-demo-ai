import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Download, RefreshCw, ChevronRight, ChevronLeft, Square } from 'lucide-react';
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
  // Pagination state
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMoreFiles, setHasMoreFiles] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  // Store page tokens for navigation
  const [pageTokens, setPageTokens] = useState([]);
  // Total file count
  const [totalFileCount, setTotalFileCount] = useState(0);
  const [countingFiles, setCountingFiles] = useState(false);
  
  // Ref for cancellation
  const cancelEvaluationRef = useRef(false);

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
          
          // Reset pagination state
          setPageTokens([]);
          setCurrentPage(1);
          setNextPageToken(null);
          setTotalFileCount(0);
          
          // Fetch first page of files from the specific folder
          fetchFilesFromFolder(response.access_token);
          
          // Count total files in background
          countTotalFiles(response.access_token);
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

  // Function to fetch files from a specific Google Drive folder with pagination
  const fetchFilesFromFolder = async (token, pageToken = null) => {
    try {
      // Using the complete folder ID from the provided URL
      const folderId = '1V2yU6hLMB9LGy2zOsHTfSPVkeTGH-8Pq_67DIO36xSZKumRHcwxKchOYnGWq055_t_LZd8lV';
      
      // Build query with pagination
      let query = `q='${folderId}' in parents and mimeType = 'application/pdf'&fields=files(id,name,mimeType),nextPageToken&pageSize=100`;
      if (pageToken) {
        query += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?${query}&key=${import.meta.env.VITE_GOOGLE_DRIVE_API_KEY}`,
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
      
      // Update pagination state
      setDriveFiles(data.files || []);
      setNextPageToken(data.nextPageToken || null);
      setHasMoreFiles(!!data.nextPageToken);
      setIsProcessing(false);
      setProcessingStatus('');
    } catch (error) {
      setConnectionError(`Failed to fetch files from Google Drive: ${error.message}`);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to count total files in the folder
  const countTotalFiles = async (token) => {
    setCountingFiles(true);
    setProcessingStatus('Counting total files...');
    
    try {
      // Using the complete folder ID from the provided URL
      const folderId = '1IsUJV36Mi4WBJUjzOkK_bWqC79LQY7AiKLluNpOYnpo7ALlltXRs8y0sYarDbUn3WMA70LuI';
      
      let totalFiles = 0;
      let pageToken = null;
      
      do {
        // Build query with pagination
        let query = `q='${folderId}' in parents and mimeType = 'application/pdf'&fields=files(id,name,mimeType),nextPageToken&pageSize=100`;
        if (pageToken) {
          query += `&pageToken=${pageToken}`;
        }
        
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?${query}&key=${import.meta.env.VITE_GOOGLE_DRIVE_API_KEY}`,
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
        totalFiles += data.files ? data.files.length : 0;
        pageToken = data.nextPageToken || null;
        
        // Update status to show progress
        setProcessingStatus(`Counting total files... ${totalFiles} found so far`);
      } while (pageToken);
      
      setTotalFileCount(totalFiles);
      setCountingFiles(false);
      setProcessingStatus('');
    } catch (error) {
      setConnectionError(`Failed to count total files: ${error.message}`);
      setCountingFiles(false);
      setProcessingStatus('');
    }
  };

  // Function to load next page of files
  const loadNextPage = () => {
    if (hasMoreFiles && nextPageToken && accessToken) {
      setIsProcessing(true);
      setProcessingStatus('Loading more files...');
      
      // Store current page token for potential back navigation
      setPageTokens(prev => [...prev, nextPageToken]);
      setCurrentPage(currentPage + 1);
      fetchFilesFromFolder(accessToken, nextPageToken);
    }
  };

  // Function to load previous page of files
  const loadPreviousPage = () => {
    if (currentPage > 1 && accessToken) {
      setIsProcessing(true);
      setProcessingStatus('Loading previous files...');
      
      // Calculate the page token for the previous page
      const newPageTokens = [...pageTokens];
      newPageTokens.pop(); // Remove the current page token
      setPageTokens(newPageTokens);
      
      const previousPageToken = newPageTokens.length > 0 ? newPageTokens[newPageTokens.length - 1] : null;
      
      setCurrentPage(currentPage - 1);
      fetchFilesFromFolder(accessToken, previousPageToken);
    }
  };

  // Function to disconnect from Google Drive
  const disconnectFromGoogleDrive = () => {
    setIsConnected(false);
    setDriveFiles([]);
    setSelectedFiles([]);
    setAccessToken(null);
    setConnectionError(null);
    setNextPageToken(null);
    setHasMoreFiles(true);
    setCurrentPage(1);
    setPageTokens([]);
    setTotalFileCount(0);
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

  // Function to select all files
  const selectAllFiles = () => {
    setSelectedFiles([...driveFiles]);
  };

  // Function to deselect all files
  const deselectAllFiles = () => {
    setSelectedFiles([]);
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

  // Function to evaluate content using the Gemini API
  const evaluateContent = async (pdfBlob, fileName) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Please set VITE_GEMINI_API_KEY in your .env file');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      // Convert PDF blob to base64 using a more robust approach
      const arrayBuffer = await pdfBlob.arrayBuffer();
      let base64PDF;
      
      // Use a more memory-efficient approach for base64 encoding
      if (typeof Buffer !== 'undefined') {
        // Node.js environment
        base64PDF = Buffer.from(arrayBuffer).toString('base64');
      } else {
        // Browser environment - chunk the data to avoid stack overflow
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000; // 32KB chunks
        
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        
        base64PDF = btoa(binary);
      }

      // Build the evaluation prompt
      const prompt = `
You are an experienced college professor evaluating a Food Safety and Quality Management project report. Analyze the document and provide scores based on the rubric below.

EVALUATION RUBRIC (Total: 30 marks):

Criterion 1 - Report Completeness and Structure (10 marks):
Check if the report contains Introduction, Methodology, Findings, Conclusion, and References sections. The report should be well-organized with logical flow.
Score 9-10: All sections present, excellent structure
Score 7-8: All sections present, good organization
Score 5-6: Most sections present, some gaps
Score 3-4: Several sections missing
Score 0-2: Major sections missing

Criterion 2 - Depth of Analysis (10 marks):
Evaluate understanding of FSQM concepts, analytical insights, pattern recognition, and relevance to food safety and quality management principles.
Score 9-10: Exceptional analysis with deep insights
Score 7-8: Strong analysis with good insights
Score 5-6: Adequate analysis with basic insights
Score 3-4: Superficial analysis
Score 0-2: No meaningful analysis

Criterion 3 - Quality of Documentation (5 marks):
Assess clarity of writing, formatting consistency, proper referencing, and quality of tables and figures.
Score 5: Excellent quality throughout
Score 4: Good quality with minor issues
Score 3: Acceptable quality
Score 2: Poor quality
Score 0-1: Very poor quality

Criterion 4 - Originality and Effort (5 marks):
Determine if the work shows independent thinking, avoids copy-paste, and demonstrates genuine effort.
Score 5: Highly original with substantial effort
Score 4: Good originality and effort
Score 3: Some originality, moderate effort
Score 2: Limited originality
Score 0-1: Copy-paste evident, minimal effort

Provide your evaluation in this exact JSON format:

{
  "criterion1": {
    "score": 0,
    "justification": "explanation here"
  },
  "criterion2": {
    "score": 0,
    "justification": "explanation here"
  },
  "criterion3": {
    "score": 0,
    "justification": "explanation here"
  },
  "criterion4": {
    "score": 0,
    "justification": "explanation here"
  },
  "total_score": 0,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overall_feedback": "comprehensive feedback here"
}

Evaluate the project report now and respond ONLY with the JSON format above.
      `;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64PDF
                }
              }
            ]
          }
        ],
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
    cancelEvaluationRef.current = false;
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        // Check if evaluation was cancelled
        if (cancelEvaluationRef.current) {
          setProcessingStatus('Evaluation cancelled');
          break;
        }
        
        const file = selectedFiles[i];
        setProcessingStatus(`Processing file ${i + 1} of ${selectedFiles.length}: ${file.name}`);
        
        try {
          // Fetch PDF from Google Drive
          const pdfBlob = await fetchPDFBlobFromDrive(file.id);
          
          // Evaluate PDF directly (without text extraction)
          const evaluation = await evaluateContent(pdfBlob, file.name);
          const result = {
            fileName: file.name,
            ...evaluation
          };
          results.push(result);
          setEvaluationResults([...results]); // Update results in real-time
        } catch (fileError) {
          const errorResult = {
            fileName: file.name,
            error: fileError.message
          };
          results.push(errorResult);
          setEvaluationResults([...results]); // Update results in real-time
        }
      }
      
      setProcessingStatus('');
      setIsProcessing(false);
    } catch (error) {
      setConnectionError('Failed to evaluate PDFs: ' + error.message);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to evaluate all PDFs
  const evaluateAllPDFs = async () => {
    if (driveFiles.length === 0) {
      setConnectionError('No PDF files found to evaluate');
      return;
    }
    
    // Select all files for evaluation
    setSelectedFiles([...driveFiles]);
    
    // Trigger evaluation
    setIsProcessing(true);
    setEvaluationResults([]);
    setConnectionError(null);
    cancelEvaluationRef.current = false;
    
    try {
      const results = [];
      
      for (let i = 0; i < driveFiles.length; i++) {
        // Check if evaluation was cancelled
        if (cancelEvaluationRef.current) {
          setProcessingStatus('Evaluation cancelled');
          break;
        }
        
        const file = driveFiles[i];
        setProcessingStatus(`Processing file ${i + 1} of ${driveFiles.length}: ${file.name}`);
        
        try {
          // Fetch PDF from Google Drive
          const pdfBlob = await fetchPDFBlobFromDrive(file.id);
          
          // Evaluate PDF directly (without text extraction)
          const evaluation = await evaluateContent(pdfBlob, file.name);
          const result = {
            fileName: file.name,
            ...evaluation
          };
          results.push(result);
          setEvaluationResults([...results]); // Update results in real-time
        } catch (fileError) {
          const errorResult = {
            fileName: file.name,
            error: fileError.message
          };
          results.push(errorResult);
          setEvaluationResults([...results]); // Update results in real-time
        }
      }
      
      setProcessingStatus('');
      setIsProcessing(false);
    } catch (error) {
      setConnectionError('Failed to evaluate PDFs: ' + error.message);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Function to cancel evaluation
  const cancelEvaluation = () => {
    cancelEvaluationRef.current = true;
    setProcessingStatus('Cancelling evaluation...');
  };

  // Function to clear results
  const clearResults = () => {
    setEvaluationResults([]);
  };

  // Function to get status color based on score
  const getStatusColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-blue-100 text-blue-800';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
            
            {/* Total file count and page info */}
            <div className="mb-3 flex justify-between items-center text-sm text-gray-600">
              <div>
                {totalFileCount > 0 ? (
                  <span>Total files: {totalFileCount}</span>
                ) : countingFiles ? (
                  <span>Counting files...</span>
                ) : (
                  <span>Calculating total files...</span>
                )}
              </div>
              <div>
                Page {currentPage} of {Math.ceil(totalFileCount / 100) || 1}
              </div>
            </div>
            
            {/* Loading Animation */}
            {isProcessing && processingStatus.includes('Loading') && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="mt-2 text-gray-600">{processingStatus}</p>
              </div>
            )}
            
            {!isProcessing && driveFiles.length > 0 ? (
              <>
                <div className="mb-2 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (selectedFiles.length === driveFiles.length) {
                          deselectAllFiles();
                        } else {
                          selectAllFiles();
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedFiles.length === driveFiles.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {/* Auto-evaluate all button */}
                    <button
                      onClick={evaluateAllPDFs}
                      disabled={isProcessing}
                      className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                    >
                      Evaluate All
                    </button>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center space-x-2">
                    {currentPage > 1 && (
                      <button
                        onClick={loadPreviousPage}
                        disabled={isProcessing}
                        className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                    )}
                    {hasMoreFiles && (
                      <button
                        onClick={loadNextPage}
                        disabled={isProcessing}
                        className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
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
                <div className="mt-2 text-sm text-gray-500 text-right">
                  Showing {driveFiles.length} files on page {currentPage} of {Math.ceil(totalFileCount / 100) || 1}
                </div>
              </>
            ) : !isProcessing && driveFiles.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No PDF files found in your Google Drive folder
              </div>
            ) : null}
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 flex justify-end space-x-2">
                {isProcessing ? (
                  <button
                    onClick={cancelEvaluation}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    <Square className="mr-2" size={16} />
                    Stop Evaluation
                  </button>
                ) : (
                  <button
                    onClick={evaluatePDFs}
                    disabled={isProcessing}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    <Download className="mr-2" size={16} />
                    Evaluate Selected PDFs
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Processing Status */}
        {isProcessing && processingStatus && !processingStatus.includes('Loading') && (
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
        
        {/* Results Section - Table Format */}
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
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Criterion 1<br/><span className="font-normal">(10 marks)</span></th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Criterion 2<br/><span className="font-normal">(10 marks)</span></th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Criterion 3<br/><span className="font-normal">(5 marks)</span></th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Criterion 4<br/><span className="font-normal">(5 marks)</span></th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total<br/><span className="font-normal">(30 marks)</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {evaluationResults.map((result, index) => (
                    <tr key={index} className={result.error ? "bg-red-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.fileName}
                        {result.error && (
                          <div className="text-red-500 text-xs mt-1">Error: {result.error}</div>
                        )}
                      </td>
                      {!result.error && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(result.criterion1.score, 10)}`}>
                              {result.criterion1.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(result.criterion2.score, 10)}`}>
                              {result.criterion2.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(result.criterion3.score, 5)}`}>
                              {result.criterion3.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(result.criterion4.score, 5)}`}>
                              {result.criterion4.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 rounded-full font-bold ${getStatusColor(result.total_score, 30)}`}>
                              {result.total_score}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleDrivePDFEvaluator;
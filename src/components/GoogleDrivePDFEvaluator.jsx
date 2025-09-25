import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

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

  // Function to initialize Google Drive client
  const initializeGoogleClient = async () => {
    try {
      await loadGoogleScript();
      
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
      // In a real implementation, this would use the Google Identity Services
      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsProcessing(false);
        setIsConnected(true);
        setAccessToken('simulated_access_token');
        setProcessingStatus('');
        // Mock files for demonstration
        setDriveFiles([
          { id: '1', name: 'Innovation_Project_Summary.pdf', mimeType: 'application/pdf' },
          { id: '2', name: 'Hackathon_Submission.pdf', mimeType: 'application/pdf' },
          { id: '3', name: 'Project_Presentation.pdf', mimeType: 'application/pdf' }
        ]);
      }, 1500);
    } catch (error) {
      setConnectionError(error.message);
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

  // Function to extract text from PDF
  const extractTextFromPDF = async (fileData) => {
    try {
      // In a real implementation, we would fetch the PDF from Google Drive
      // For now, we'll simulate text extraction
      return `This is simulated text extracted from ${fileData.name}. In a real implementation, this would contain the actual content of the PDF file which would then be evaluated by the AI system.`;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  };

  // Function to evaluate content using the existing evaluation logic
  const evaluateContent = async (content, fileName) => {
    try {
      // In a real implementation, this would call the Google Generative AI API
      // similar to how it's done in BatchEvaluationProcessor
      // For now, we'll simulate the evaluation
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a random score and feedback
      const score = Math.floor(Math.random() * 40) + 30; // Random score between 30-70
      const statuses = ['exemplar', 'average', 'weak'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        fileName,
        score,
        status,
        feedback: 'This is a simulated evaluation. In a production environment, this would contain detailed feedback based on the actual content of the PDF using the same evaluation criteria as the batch processor.'
      };
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
          // Extract text from PDF
          const textContent = await extractTextFromPDF(file);
          
          // Evaluate content
          const evaluation = await evaluateContent(textContent, file.name);
          results.push(evaluation);
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
                    Connecting...
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
                No PDF files found in your Google Drive
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
                style={{ width: '50%' }}
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
                          <span className="font-bold text-lg">{result.score}/70</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-2 rounded-full bg-blue-600" 
                            style={{ width: `${(result.score / 70) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">{result.feedback}</p>
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
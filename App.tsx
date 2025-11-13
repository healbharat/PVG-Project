
import React, { useState, useCallback } from 'react';
import { analyzeImage } from './services/geminiService';
import { UploadIcon, ImageIcon, SparklesIcon, AlertTriangleIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setGeneratedText('');
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!imageFile) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setGeneratedText('');
    setError('');
    setIsAnimating(true);

    try {
      const text = await analyzeImage(imageFile);
      setGeneratedText(text);
    } catch (err: any) {
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
       setTimeout(() => setIsAnimating(false), 500);
    }
  }, [imageFile]);

  const ResultDisplay: React.FC = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="mt-4 text-lg text-gray-300">Analyzing image...</p>
          <p className="text-sm text-gray-500">The AI is working its magic.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-red-900/20 rounded-lg p-4">
            <AlertTriangleIcon className="w-12 h-12 text-red-500" />
            <p className="mt-4 font-semibold text-red-400">Analysis Failed</p>
            <p className="mt-2 text-sm text-red-300">{error}</p>
        </div>
      );
    }

    if (generatedText) {
      return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-800 rounded-lg relative">
          <h3 className="text-xl font-bold text-blue-300 flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 mr-2 text-blue-400" />
            Analysis Result
          </h3>
          <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{generatedText}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
        <SparklesIcon className="w-16 h-16" />
        <p className="mt-4 text-lg">Your analysis will appear here</p>
        <p className="text-sm">Upload an image and click "Analyze" to begin.</p>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
          VisionText AI
        </h1>
        <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
          Upload any image, especially a doctor's receipt, and let our AI extract and explain the text for you.
        </p>
      </header>

      <main className="w-full max-w-6xl flex-grow bg-gray-800/50 rounded-2xl shadow-2xl shadow-blue-500/10 backdrop-blur-sm border border-gray-700 overflow-hidden">
        <div className="grid md:grid-cols-2 h-full">
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Upload Your Image</h2>
            <div className="flex-grow flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-4 border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors duration-300">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-80 w-auto object-contain rounded-lg shadow-lg" />
              ) : (
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-24 h-24 mx-auto" />
                  <p className="mt-2">Image preview will appear here</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <label htmlFor="file-upload" className="w-full cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-3 px-4 rounded-lg inline-flex items-center justify-center transition-colors duration-300">
                <UploadIcon className="w-5 h-5 mr-2" />
                <span>{imageFile ? 'Change Image' : 'Select Image'}</span>
              </label>
              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              {imageFile && <p className="text-sm text-gray-400 mt-2 text-center truncate">Selected: {imageFile.name}</p>}
            </div>
          </div>
          
          <div className={`p-6 md:p-8 flex flex-col transition-all duration-500 ${isAnimating ? 'transform scale-95 opacity-50' : 'transform scale-100 opacity-100'}`}>
            <ResultDisplay />
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/50 backdrop-blur-sm md:static">
         <button 
            onClick={handleSubmit} 
            disabled={!imageFile || isLoading}
            className="w-full max-w-md mx-auto h-16 text-xl font-bold rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center
                      bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30
                      hover:scale-105 hover:shadow-xl hover:shadow-blue-500/40
                      disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
            {!isLoading && <SparklesIcon className="w-6 h-6 ml-3" />}
          </button>
      </div>
    </div>
  );
};

export default App;

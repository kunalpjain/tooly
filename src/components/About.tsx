import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          About Tooly
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            Tooly is a free online developer toolbox for JSON, YAML, Base64, and text diff.
          </p>
          
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            No ads, no signup – just useful tools for engineers.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Why Tooly?</h2>
            <ul className="text-blue-700 space-y-1">
              <li>• Fast and reliable encoding/decoding tools</li>
              <li>• Clean, intuitive interface</li>
              <li>• No registration required</li>
              <li>• Built with modern web technologies</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Our Tools
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;

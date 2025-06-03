import React, { useState } from 'react';
import * as Diff from 'diff';

interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

const TextDiffTool: React.FC = () => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [diffParts, setDiffParts] = useState<DiffPart[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [showUnified, setShowUnified] = useState(false);
  const [diffMode, setDiffMode] = useState<'chars' | 'lines'>('lines');
  const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

  const processDiff = (leftText: string, rightText: string) => {
    // Use line-level or character-level diff based on user choice
    const diff = diffMode === 'lines' 
      ? Diff.diffLines(leftText, rightText)
      : Diff.diffChars(leftText, rightText);
    
    const processedParts: DiffPart[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    diff.forEach((part) => {
      if (part.added) {
        processedParts.push({
          type: 'added',
          value: part.value
        });
        addedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      } else if (part.removed) {
        processedParts.push({
          type: 'removed',
          value: part.value
        });
        removedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      } else {
        processedParts.push({
          type: 'unchanged',
          value: part.value
        });
        unchangedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      }
    });

    setDiffParts(processedParts);
    setStats({ added: addedCount, removed: removedCount, unchanged: unchangedCount });
  };

  const handleCompare = () => {
    if (!leftText && !rightText) {
      setDiffParts([]);
      setShowDiff(false);
      setStats({ added: 0, removed: 0, unchanged: 0 });
      return;
    }

    processDiff(leftText, rightText);
    setShowDiff(true);
  };

  const handleClear = () => {
    setLeftText('');
    setRightText('');
    setDiffParts([]);
    setShowDiff(false);
    setShowUnified(false);
    setStats({ added: 0, removed: 0, unchanged: 0 });
  };

  const handleSwitch = () => {
    const temp = leftText;
    setLeftText(rightText);
    setRightText(temp);
    
    // Re-run comparison if it was already shown
    if (showDiff) {
      processDiff(rightText, temp);
    }
  };

  const handleDiffModeChange = (newMode: 'chars' | 'lines') => {
    setDiffMode(newMode);
    
    // Re-run comparison if it was already shown
    if (showDiff) {
      // Process diff with the new mode
      const diff = newMode === 'lines' 
        ? Diff.diffLines(leftText, rightText)
        : Diff.diffChars(leftText, rightText);
      
      const processedParts: DiffPart[] = [];
      let addedCount = 0;
      let removedCount = 0;
      let unchangedCount = 0;

      diff.forEach((part) => {
        if (part.added) {
          processedParts.push({
            type: 'added',
            value: part.value
          });
          addedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        } else if (part.removed) {
          processedParts.push({
            type: 'removed',
            value: part.value
          });
          removedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        } else {
          processedParts.push({
            type: 'unchanged',
            value: part.value
          });
          unchangedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        }
      });

      setDiffParts(processedParts);
      setStats({ added: addedCount, removed: removedCount, unchanged: unchangedCount });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderUnifiedView = () => {
    return (
      <div className="p-4 border border-gray-200 rounded-md bg-white font-mono text-sm leading-relaxed whitespace-pre-wrap h-[750px] overflow-y-auto">
        {diffParts.map((part, index) => {
          let className = '';
          
          switch (part.type) {
            case 'added':
              className = 'bg-green-200 text-green-900 px-1 rounded';
              break;
            case 'removed':
              className = 'bg-red-200 text-red-900 px-1 rounded line-through';
              break;
            case 'unchanged':
              className = 'text-gray-800';
              break;
          }

          return (
            <span key={index} className={className}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  const renderSideBySide = () => {
    // Split diff parts into left (original) and right (modified) views
    const leftParts: DiffPart[] = [];
    const rightParts: DiffPart[] = [];

    diffParts.forEach((part) => {
      if (part.type === 'removed') {
        leftParts.push(part);
      } else if (part.type === 'added') {
        rightParts.push(part);
      } else {
        leftParts.push(part);
        rightParts.push(part);
      }
    });

    const renderSideWithLineNumbers = (parts: DiffPart[], isLeft: boolean) => {
      // Reconstruct the full text to get line count
      let fullText = '';
      parts.forEach(part => {
        fullText += part.value;
      });
      
      const lines = fullText.split('\n');
      
      return (
        <div className="border border-gray-200 rounded-md bg-white h-[750px] overflow-y-auto">
          <div className="flex text-sm font-mono">
            {/* Line numbers column */}
            <div className="w-12 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 text-right py-4 px-2 select-none flex-shrink-0">
              {lines.map((_, index) => (
                <div key={index} className="h-[21px] leading-[21px]">
                  {index + 1}
                </div>
              ))}
            </div>
            
            {/* Content column */}
            <div className="flex-1 p-4 leading-[21px] whitespace-pre-wrap">
              {parts.map((part, index) => {
                let className = '';
                
                if (isLeft && part.type === 'removed') {
                  className = 'bg-red-200 text-red-900 px-1 rounded';
                } else if (!isLeft && part.type === 'added') {
                  className = 'bg-green-200 text-green-900 px-1 rounded';
                } else if (part.type === 'unchanged') {
                  className = 'text-gray-800';
                }

                return (
                  <span key={index} className={className}>
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Text A (with deletions)</h4>
          {renderSideWithLineNumbers(leftParts, true)}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Text B (with additions)</h4>
          {renderSideWithLineNumbers(rightParts, false)}
        </div>
      </div>
    );
  };

  const renderDiffResult = () => {
    if (!showDiff) {
      return (
        <div className="text-gray-500 text-center h-[750px] flex flex-col justify-center">
          <div className="text-lg mb-2">📝 Ready to compare</div>
          <div>Enter text in both fields and click "Compare" to see character-level differences</div>
        </div>
      );
    }

    if (diffParts.length === 0 || (leftText === rightText)) {
      return (
        <div className="text-gray-500 text-center h-[750px] flex flex-col justify-center">
          <div className="text-lg mb-2">✅ No differences found</div>
          <div>Both texts are identical</div>
        </div>
      );
    }

    return showUnified ? renderUnifiedView() : renderSideBySide();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Text Diff Tool</h2>
      
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="leftText" className="block text-sm font-medium text-gray-700">
              Text A
            </label>
            <button
              onClick={() => copyToClipboard(leftText)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <textarea
            id="leftText"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            className="w-full h-[350px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="Enter first text here..."
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="rightText" className="block text-sm font-medium text-gray-700">
              Text B
            </label>
            <button
              onClick={() => copyToClipboard(rightText)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <textarea
            id="rightText"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            className="w-full h-[350px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="Enter second text here..."
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCompare}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          🕵️ Detect Changes
        </button>
        <button
          onClick={handleSwitch}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors text-sm"
        >
          ↔️ Switch
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
        >
          Clear
        </button>
        
        {/* Diff Mode Toggle */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => handleDiffModeChange('lines')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              diffMode === 'lines'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📄 Lines
          </button>
          <button
            onClick={() => handleDiffModeChange('chars')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              diffMode === 'chars'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔤 Chars
          </button>
        </div>

        {showDiff && diffParts.length > 0 && (
          <button
            onClick={() => setShowUnified(!showUnified)}
            className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-sm ${
              showUnified 
                ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
            }`}
          >
            {showUnified ? '📊 Side-by-Side' : '📝 Unified View'}
          </button>
        )}
      </div>

      {/* Stats */}
      {showDiff && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="font-medium text-green-800">
                {stats.added} {diffMode === 'lines' ? 'lines' : 'characters'} added
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="font-medium text-red-800">
                {stats.removed} {diffMode === 'lines' ? 'lines' : 'characters'} removed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span className="font-medium text-gray-700">
                {stats.unchanged} {diffMode === 'lines' ? 'lines' : 'characters'} unchanged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Diff Output */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {showUnified ? 'Unified View' : 'Side-by-Side Comparison'}
          </h3>
          {showDiff && diffParts.length > 0 && (
            <span className="text-sm text-gray-600">
              {showUnified ? '(Green = Added, Red = Removed)' : '(Red = Deleted, Green = Added)'}
            </span>
          )}
        </div>
        <div className="bg-white">
          {renderDiffResult()}
        </div>
      </div>
    </div>
  );
};

export default TextDiffTool; 
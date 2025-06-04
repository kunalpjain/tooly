import React, { useState, useEffect, useCallback, useRef } from 'react';

type EncodingType = 'base64' | 'url' | 'jwt' | 'hex' | 'unicode';



const SmartConverter: React.FC = () => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [encodingType, setEncodingType] = useState<EncodingType>('base64');
  const [error, setError] = useState('');
  const [lastModified, setLastModified] = useState<'left' | 'right' | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'left' | 'right' | null>(null);
  const [showSyntaxHighlight, setShowSyntaxHighlight] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Robust Base64 decoder that can handle partial invalid strings
  const robustBase64Decode = useCallback((input: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let buffer = 0;
    let bitsCollected = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '=') break; // Stop at padding
      
      const charIndex = chars.indexOf(char);
      if (charIndex === -1) continue; // Skip invalid characters
      
      buffer = (buffer << 6) | charIndex;
      bitsCollected += 6;
      
      if (bitsCollected >= 8) {
        bitsCollected -= 8;
        const byte = (buffer >> bitsCollected) & 0xFF;
        result += String.fromCharCode(byte);
      }
    }

    try {
      return decodeURIComponent(escape(result));
    } catch {
      return result; // Return raw result if UTF-8 decoding fails
    }
  }, []);

  // Base64 functions - Robust implementation
  const encodeBase64 = useCallback((text: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (error) {
      throw new Error('Failed to encode as Base64');
    }
  }, []);

  const decodeBase64 = useCallback((text: string): string => {
    try {
      // Clean the input - remove whitespace and non-base64 characters
      let cleanInput = text.replace(/[^A-Za-z0-9+/]/g, '');
      
      // Add padding if missing
      while (cleanInput.length % 4) {
        cleanInput += '=';
      }

      // Try standard atob first
      try {
        return decodeURIComponent(escape(atob(cleanInput)));
      } catch {
        // If atob fails, try manual decoding for partial recovery
        return robustBase64Decode(cleanInput);
      }
    } catch (error) {
      throw new Error('Invalid Base64 string');
    }
  }, [robustBase64Decode]);

  // URL encoding functions
  const encodeURL = useCallback((text: string): string => {
    try {
      return encodeURIComponent(text);
    } catch (error) {
      throw new Error('Failed to encode as URL');
    }
  }, []);

  const decodeURL = useCallback((text: string): string => {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      throw new Error('Invalid URL encoded string');
    }
  }, []);

  // JWT functions
  const decodeJWT = useCallback((token: string): string => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const header = JSON.parse(decodeBase64(parts[0]));
      const payload = JSON.parse(decodeBase64(parts[1]));
      
      return JSON.stringify({
        header,
        payload,
        signature: parts[2]
      });
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }, [decodeBase64]);

  // Hex/ASCII functions
  const encodeHex = useCallback((text: string): string => {
    try {
      return text.split('').map(char => 
        char.charCodeAt(0).toString(16).padStart(2, '0')
      ).join(' ');
    } catch (error) {
      throw new Error('Failed to encode as Hex');
    }
  }, []);

  const decodeHex = useCallback((hex: string): string => {
    try {
      const cleanHex = hex.replace(/\s+/g, '');
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
      }
      
      let result = '';
      for (let i = 0; i < cleanHex.length; i += 2) {
        const hexPair = cleanHex.substr(i, 2);
        const charCode = parseInt(hexPair, 16);
        if (isNaN(charCode)) {
          throw new Error('Invalid hex character');
        }
        result += String.fromCharCode(charCode);
    }
      return result;
    } catch (error) {
      throw new Error('Invalid hex string');
    }
  }, []);

  // Unicode Escape functions
  const encodeUnicode = useCallback((text: string): string => {
    try {
      return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code > 127) {
          return '\\u' + code.toString(16).padStart(4, '0');
        }
        return char;
      }).join('');
    } catch (error) {
      throw new Error('Failed to encode as Unicode');
    }
  }, []);

  const decodeUnicode = useCallback((text: string): string => {
    try {
      return text.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });
    } catch (error) {
      throw new Error('Invalid Unicode escape string');
    }
  }, []);

  const handleBeautify = useCallback(() => {
    if (!rightText.trim()) {
      setError('No content to beautify');
      return;
    }

    try {
      const trimmed = rightText.trim();
      let beautified = trimmed;
      
      // Check if content is already properly beautified JSON
      const isAlreadyBeautifiedJSON = (() => {
        try {
          JSON.parse(trimmed);
          // Check for proper JSON formatting (has newlines and indentation)
          return trimmed.includes('\n') && trimmed.includes('  ');
        } catch {
          return false;
        }
      })();

      if (isAlreadyBeautifiedJSON) {
        // Content is already beautified, just enable syntax highlighting
        setError('');
        setShowSyntaxHighlight(true);
        return;
      }
      
      // Enhanced robust JSON beautification
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // Try standard JSON first
        try {
          const parsed = JSON.parse(trimmed);
          beautified = JSON.stringify(parsed, null, 2);
        } catch {
          // Apply robust fixes for common JSON issues
          let fixed = trimmed;
          
          // 1. Add missing quotes around keys
          fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
          
          // 2. Fix single quotes to double quotes
          fixed = fixed.replace(/'/g, '"');
          
          // 3. Remove trailing commas
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          
          // 4. Try to fix incomplete objects/arrays
          let openBraces = (fixed.match(/{/g) || []).length;
          let closeBraces = (fixed.match(/}/g) || []).length;
          let openBrackets = (fixed.match(/\[/g) || []).length;
          let closeBrackets = (fixed.match(/\]/g) || []).length;
          
          // Add missing closing braces/brackets
          while (openBraces > closeBraces) {
            fixed += '}';
            closeBraces++;
          }
          while (openBrackets > closeBrackets) {
            fixed += ']';
            closeBrackets++;
          }
          
          // Try to parse the fixed version
          try {
            const parsed = JSON.parse(fixed);
            beautified = JSON.stringify(parsed, null, 2);
          } catch {
            // If still fails, try partial line-by-line processing
            const lines = trimmed.split('\n');
            const processedLines: string[] = [];
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // Try to parse individual lines as JSON
              try {
                const parsed = JSON.parse(trimmedLine);
                processedLines.push(JSON.stringify(parsed, null, 2));
              } catch {
                // Try to extract and beautify JSON-like patterns
                const jsonPattern = /\{[^{}]*\}/g;
                const matches = trimmedLine.match(jsonPattern);
                
                if (matches) {
                  let processedLine = trimmedLine;
                  for (const match of matches) {
                    try {
                      const parsed = JSON.parse(match);
                      const beautifiedMatch = JSON.stringify(parsed, null, 2);
                      processedLine = processedLine.replace(match, beautifiedMatch);
                    } catch {
                      // Keep original if can't parse
                    }
                  }
                  processedLines.push(processedLine);
                } else {
                  processedLines.push(line); // Keep original line
                }
              }
            }
            
            beautified = processedLines.join('\n');
          }
        }
      } else {
        // Try standard JSON parsing for non-obvious JSON
        try {
          const parsed = JSON.parse(trimmed);
          beautified = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, keep original
          beautified = trimmed;
        }
      }
      
      if (beautified !== trimmed) {
        setLastModified(null);
        setRightText(beautified);
      setError('');
        // Enable syntax highlighting after successful beautification
        if (beautified.trim().startsWith('{') || beautified.trim().startsWith('[')) {
          setShowSyntaxHighlight(true);
        }
      } else {
        setError('Content could not be beautified');
      }
      
    } catch (err) {
      setError('Failed to beautify content: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [rightText]);

  // Toggle collapse/expand for a path and its direct children
  const toggleCollapse = useCallback((path: string, obj: any) => {
    setCollapsedPaths(prev => {
      const newSet = new Set(prev);
      const isCurrentlyCollapsed = newSet.has(path);
      
      if (isCurrentlyCollapsed) {
        // Expanding: remove current path and expand direct children
        newSet.delete(path);
        
        // Also expand all direct children (first level only)
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const childPath = path === '' ? `[${index}]` : `${path}[${index}]`;
              newSet.delete(childPath);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const childPath = path === '' ? key : `${path}.${key}`;
              newSet.delete(childPath);
            }
          });
        }
      } else {
        // Collapsing: add current path
        newSet.add(path);
      }
      
      return newSet;
    });
  }, []);

  // Render collapsible JSON with syntax highlighting
  const renderCollapsibleJSON = useCallback((obj: any, path: string = '', indentLevel: number = 0): React.ReactElement => {
    
    if (obj === null) {
      return <span className="text-gray-500 italic">null</span>;
    }
    
    if (typeof obj === 'boolean') {
      return <span className="text-purple-600 font-medium">{obj.toString()}</span>;
    }
    
    if (typeof obj === 'number') {
      return <span className="text-orange-600 font-medium">{obj}</span>;
    }
    
    if (typeof obj === 'string') {
      return <span className="text-green-600">"{obj}"</span>;
    }
    
    if (Array.isArray(obj)) {
      const isCollapsed = collapsedPaths.has(path);
      const isEmpty = obj.length === 0;
      
      if (isEmpty) {
        return <span className="text-gray-800 font-bold">[]</span>;
      }
      
      return (
        <span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(path, obj);
            }}
            className="relative z-30 inline-flex items-center justify-center w-5 h-5 mr-2 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title={isCollapsed ? "Expand array and children" : "Collapse array"}
          >
            <span className="text-xs font-medium leading-none">
              {isCollapsed ? '+' : '−'}
            </span>
          </button>
          <span className="text-gray-800 font-bold">[</span>
          {isCollapsed ? (
            <span className="text-gray-500 italic"> ... {obj.length} items </span>
          ) : (
            <>
              <br />
              {obj.map((item, index) => (
                <div key={index} style={{ marginLeft: `${(indentLevel + 1) * 20}px` }}>
                  {renderCollapsibleJSON(item, path === '' ? `[${index}]` : `${path}[${index}]`, indentLevel + 1)}
                  {index < obj.length - 1 && <span className="text-gray-800 font-bold">,</span>}
                  <br />
                </div>
              ))}
              <div style={{ marginLeft: `${indentLevel * 20}px` }}></div>
            </>
          )}
          <span className="text-gray-800 font-bold">]</span>
        </span>
      );
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const isCollapsed = collapsedPaths.has(path);
      const isEmpty = keys.length === 0;
      
      if (isEmpty) {
        return <span className="text-gray-800 font-bold">{"{}"}</span>;
      }
      
      return (
        <span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(path, obj);
            }}
            className="relative z-30 inline-flex items-center justify-center w-5 h-5 mr-2 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            title={isCollapsed ? "Expand object and children" : "Collapse object"}
          >
            <span className="text-xs font-medium leading-none">
              {isCollapsed ? '+' : '−'}
            </span>
          </button>
          <span className="text-gray-800 font-bold">{"{"}</span>
          {isCollapsed ? (
            <span className="text-gray-500 italic"> ... {keys.length} keys </span>
          ) : (
            <>
              <br />
              {keys.map((key, index) => (
                <div key={key} style={{ marginLeft: `${(indentLevel + 1) * 20}px` }}>
                  <span className="text-blue-600 font-semibold">"{key}"</span>
                  <span className="text-gray-800 font-bold">: </span>
                  {renderCollapsibleJSON(obj[key], path === '' ? key : `${path}.${key}`, indentLevel + 1)}
                  {index < keys.length - 1 && <span className="text-gray-800 font-bold">,</span>}
                  <br />
                </div>
              ))}
              <div style={{ marginLeft: `${indentLevel * 20}px` }}></div>
            </>
          )}
          <span className="text-gray-800 font-bold">{"}"}</span>
        </span>
      );
    }
    
    return <span>{String(obj)}</span>;
  }, [collapsedPaths, toggleCollapse]);

  // Main JSON renderer with error handling
  const highlightJSON = useCallback((jsonString: string): React.ReactElement => {
    if (!jsonString.trim()) {
      return <span className="text-gray-400">No content</span>;
    }

    // Check if it's valid JSON first
    let isValidJSON = false;
    let parsedData: any = null;
    
    try {
      parsedData = JSON.parse(jsonString);
      isValidJSON = true;
    } catch {
      isValidJSON = false;
    }

    if (isValidJSON && parsedData && (typeof parsedData === 'object')) {
      // Valid JSON - render with collapsible structure
      return (
        <div className="whitespace-pre-wrap font-mono text-sm">
          {renderCollapsibleJSON(parsedData)}
        </div>
      );
    } else {
      // Invalid JSON - fall back to simple syntax highlighting
      const lines = jsonString.split('\n');
      const highlightedLines = lines.map((line, index) => {
        let highlighted = line
          // Highlight quoted strings (both valid and invalid)
          .replace(/"([^"]*)":/g, '<span class="text-blue-600 font-semibold">"$1"</span>:')
          .replace(/:\s*"([^"]*)"/g, ': <span class="text-green-600">"$1"</span>')
          // Highlight unquoted keys (common error) with warning color
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1<span class="text-yellow-600 font-semibold bg-yellow-100 px-1 rounded">$2</span>:')
          // Highlight single quotes (common error) with warning color
          .replace(/'([^']*)'/g, '<span class="text-yellow-600 bg-yellow-100 px-1 rounded">\'$1\'</span>')
          // Highlight boolean and null values
          .replace(/:\s*(true|false)/g, ': <span class="text-purple-600 font-medium">$1</span>')
          .replace(/:\s*(null)/g, ': <span class="text-gray-500 italic">$1</span>')
          // Highlight numbers (avoid matching time formats)
          .replace(/:\s*(\d+(?:\.\d+)?)\s*([,}\]])/g, ': <span class="text-orange-600 font-medium">$1</span>$2')
          // Highlight structural characters
          .replace(/([{}[\],])/g, '<span class="text-gray-800 font-bold">$1</span>')
          // Highlight trailing commas (common error) with error color
          .replace(/,(\s*[}\]])/g, '<span class="text-red-600 bg-red-100 px-1 rounded">,</span>$1');

        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: highlighted }} />
        );
      });

      return (
        <div className="whitespace-pre-wrap">
          <div className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded border-l-4 border-red-400">
            ⚠️ Invalid JSON detected. Click Beautify to fix common errors.
          </div>
          {highlightedLines}
        </div>
      );
    }
  }, [renderCollapsibleJSON]);

  // Sync scroll between textarea and highlight background
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Convert based on which panel was last modified
  useEffect(() => {
    if (lastModified === 'left' && leftText.trim()) {
      // Decode from left (encoded) to right (plain)
    try {
      setError('');
        let result = '';
        
        if (encodingType === 'base64') {
          result = decodeBase64(leftText);
        } else if (encodingType === 'url') {
          result = decodeURL(leftText);
        } else if (encodingType === 'jwt') {
          result = decodeJWT(leftText);
        } else if (encodingType === 'hex') {
          result = decodeHex(leftText);
        } else if (encodingType === 'unicode') {
          result = decodeUnicode(leftText);
        }
        
        setRightText(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Decode failed');
        setRightText('');
      }
    } else if (lastModified === 'right' && rightText.trim()) {
      // Encode from right (plain) to left (encoded)
      try {
        setError('');
        let result = '';
        
        if (encodingType === 'base64') {
          result = encodeBase64(rightText);
        } else if (encodingType === 'url') {
          result = encodeURL(rightText);
        } else if (encodingType === 'jwt') {
          // JWT is decode-only, can't encode plain text to JWT
          throw new Error('JWT encoding not supported - JWT is decode-only');
        } else if (encodingType === 'hex') {
          result = encodeHex(rightText);
        } else if (encodingType === 'unicode') {
          result = encodeUnicode(rightText);
        }
        
        setLeftText(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Encode failed');
        setLeftText('');
      }
    } else if (lastModified === 'left' && !leftText.trim()) {
      setRightText('');
      setError('');
    } else if (lastModified === 'right' && !rightText.trim()) {
      setLeftText('');
      setError('');
    }
  }, [
    leftText, 
    rightText, 
    encodingType, 
    lastModified, 
    encodeBase64, 
    decodeBase64, 
    decodeJWT, 
    encodeURL, 
    decodeURL, 
    encodeHex, 
    decodeHex, 
    encodeUnicode, 
    decodeUnicode
  ]);

  const handleLeftTextChange = (value: string) => {
    setLeftText(value);
    setLastModified('left');
  };

  const handleRightTextChange = (value: string) => {
    setRightText(value);
    setLastModified('right');
    // Reset syntax highlighting when content changes
    if (showSyntaxHighlight) {
      setShowSyntaxHighlight(false);
    }
  };

  const handleCopyLeft = async () => {
    if (!leftText) return;
    try {
      await navigator.clipboard.writeText(leftText);
      setCopyFeedback('left');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCopyRight = async () => {
    if (!rightText) return;
    try {
      await navigator.clipboard.writeText(rightText);
      setCopyFeedback('right');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClearLeft = () => {
    setLeftText('');
    setLastModified('left');
  };

  const handleClearRight = () => {
    setRightText('');
    setLastModified('right');
    // Reset syntax highlighting when clearing content
    setShowSyntaxHighlight(false);
  };

  const getEncodingLabel = () => {
    switch (encodingType) {
      case 'base64': return 'Base64';
      case 'url': return 'URL Encoded';
      case 'jwt': return 'JWT Token';
      case 'hex': return 'Hex';
      case 'unicode': return 'Unicode Escaped';
      default: return 'Encoded';
    }
  };

  const getPlaceholder = () => {
    switch (encodingType) {
      case 'base64': return 'Enter Base64 text...';
      case 'url': return 'Enter URL encoded text...';
      case 'jwt': return 'Enter JWT token...';
      case 'hex': return 'Enter hex string (e.g., 48 65 6c 6c 6f)...';
      case 'unicode': return 'Enter Unicode escaped text (e.g., \\u0048\\u0065\\u006c\\u006c\\u006f)...';
      default: return 'Enter encoded text...';
    }
  };

  // Check if content is already beautified
  const isContentBeautified = useCallback(() => {
    if (!rightText.trim()) return false;
    try {
      JSON.parse(rightText.trim());
      return rightText.includes('\n') && rightText.includes('  ');
    } catch {
      return false;
    }
  }, [rightText]);

  const getBeautifyButtonText = () => {
    if (showSyntaxHighlight && isContentBeautified()) {
      return '✨ Beautified';
    }
    return 'Beautify';
  };

  // Expand all JSON nodes
  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
  }, []);

  // Collapse all JSON nodes
  const collapseAll = useCallback(() => {
    if (!rightText.trim()) return;
    
    try {
      const parsedData = JSON.parse(rightText);
      const allPaths = new Set<string>();
      
      const collectPaths = (obj: any, path: string = '') => {
        if (Array.isArray(obj)) {
          if (obj.length > 0) {
            allPaths.add(path);
            obj.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                collectPaths(item, path === '' ? `[${index}]` : `${path}[${index}]`);
              }
            });
          }
        } else if (typeof obj === 'object' && obj !== null) {
          const keys = Object.keys(obj);
          if (keys.length > 0) {
            allPaths.add(path);
            keys.forEach(key => {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                collectPaths(obj[key], path === '' ? key : `${path}.${key}`);
              }
            });
          }
        }
      };
      
      collectPaths(parsedData);
      setCollapsedPaths(allPaths);
    } catch {
      // Not valid JSON, do nothing
    }
  }, [rightText]);

  // Check if JSON is valid and has collapsible content
  const hasCollapsibleContent = useCallback(() => {
    if (!rightText.trim()) return false;
    try {
      const parsedData = JSON.parse(rightText);
      return typeof parsedData === 'object' && parsedData !== null;
    } catch {
      return false;
    }
  }, [rightText]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Smart Converter</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel - Encoded Text */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="encoded-text" className="block text-base font-medium text-gray-700">
              {getEncodingLabel()}
        </label>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLeft}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                disabled={!leftText}
              >
                {copyFeedback === 'left' ? '✓ Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleClearLeft}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
        <textarea
            id="encoded-text"
            value={leftText}
            onChange={(e) => handleLeftTextChange(e.target.value)}
            className="w-full h-[900px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder={getPlaceholder()}
            ref={textareaRef}
            onScroll={handleScroll}
        />
      </div>

        {/* Middle Panel - Controls */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start pt-8">
          {/* Encoding Type Selector */}
          <div className="flex flex-col items-center space-y-2 w-full">
            <span className="text-sm font-medium text-gray-700 mb-2">Encoding Type</span>
            <div className="flex flex-col space-y-1 w-full">
              <button
                onClick={() => setEncodingType('base64')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'base64'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Base64
              </button>
        <button
                onClick={() => setEncodingType('url')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'url'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
        >
                URL Encode
        </button>
        <button
                onClick={() => setEncodingType('jwt')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'jwt'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                JWT Decode
        </button>
        <button
                onClick={() => setEncodingType('hex')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'hex'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Hex / ASCII
        </button>
        <button
                onClick={() => setEncodingType('unicode')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'unicode'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Unicode Escape
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Plain Text */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="plain-text" className="block text-base font-medium text-gray-700">
              {encodingType === 'jwt' ? 'Decoded JWT' : 'Plain Text'}
            </label>
            <div className="flex space-x-2">
              {showSyntaxHighlight && hasCollapsibleContent() && (
                <>
                  <button
                    onClick={expandAll}
                    className="text-xs text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 px-3 py-1.5 rounded-full border border-blue-300 hover:border-blue-600 font-medium"
                    title="Expand all JSON nodes"
                  >
                    − All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 px-3 py-1.5 rounded-full border border-blue-300 hover:border-blue-600 font-medium"
                    title="Collapse all JSON nodes"
                  >
                    + All
                  </button>
                </>
              )}
              <button
                onClick={handleBeautify}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                disabled={!rightText}
              >
                {getBeautifyButtonText()}
        </button>
        <button
                onClick={handleCopyRight}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                disabled={!rightText}
        >
                {copyFeedback === 'right' ? '✓ Copied!' : 'Copy'}
        </button>
        <button
                onClick={handleClearRight}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
        >
          Clear
        </button>
      </div>
          </div>

          {/* Single textarea with optional syntax highlighting background */}
          <div className="relative">
            {/* Syntax highlighted background - only show when enabled and content is JSON */}
            {showSyntaxHighlight && rightText && (rightText.trim().startsWith('{') || rightText.trim().startsWith('[')) && (
              <div 
                className="absolute inset-0 w-full h-[900px] p-4 border border-gray-300 rounded-lg font-mono text-sm overflow-auto z-20 whitespace-pre-wrap break-words"
                style={{ scrollBehavior: 'auto', pointerEvents: 'auto' }}
                ref={highlightRef}
              >
                {highlightJSON(rightText)}
              </div>
            )}
            
            {/* Editable textarea */}
        <textarea
              id="plain-text"
              value={rightText}
              onChange={(e) => handleRightTextChange(e.target.value)}
              onScroll={handleScroll}
              ref={textareaRef}
              className={`relative z-10 w-full h-[900px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm ${
                showSyntaxHighlight && rightText && (rightText.trim().startsWith('{') || rightText.trim().startsWith('[')) 
                  ? 'bg-transparent text-transparent caret-gray-800' 
                  : 'bg-white text-gray-900'
              }`}
              placeholder={encodingType === 'jwt' ? 'Decoded JWT will appear here...' : 'Plain text will appear here...'}
              readOnly={encodingType === 'jwt'}
              style={{
                ...(showSyntaxHighlight && rightText && (rightText.trim().startsWith('{') || rightText.trim().startsWith('[')) ? { caretColor: '#1f2937', pointerEvents: 'none' } : {}),
              }}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        {encodingType === 'jwt' 
          ? 'JWT tokens can only be decoded. Enter a JWT token on the left to see its decoded content.'
          : 'Type in either panel to automatically convert. Both panels are editable.'
        }
      </div>
    </div>
  );
};

export default SmartConverter; 
import React, { useState } from 'react';

const ListWizard: React.FC = () => {
  const [listA, setListA] = useState('');
  const [listB, setListB] = useState('');
  const [results, setResults] = useState({
    intersection: [] as string[],
    union: [] as string[],
    onlyInA: [] as string[],
    onlyInB: [] as string[],
    symmetricDiff: [] as string[]
  });
  const [showResults, setShowResults] = useState(false);

  // Parse input text into array of unique items
  const parseList = (text: string): string[] => {
    if (!text.trim()) return [];
    
    // Split by various delimiters and clean up
    const items = text
      .split(/[,\n\r\t;|]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    // Remove duplicates while preserving order
    return Array.from(new Set(items));
  };

  const performOperations = () => {
    const setA = parseList(listA);
    const setB = parseList(listB);
    
    if (setA.length === 0 && setB.length === 0) {
      setShowResults(false);
      return;
    }

    // Convert to Sets for efficient operations
    const a = new Set(setA);
    const b = new Set(setB);

    // Intersection: A ∩ B
    const intersection = setA.filter(item => b.has(item));

    // Union: A ∪ B (preserving order from A first, then B)
    const union = setA.concat(setB.filter(item => !a.has(item)));

    // Only in A: A - B
    const onlyInA = setA.filter(item => !b.has(item));

    // Only in B: B - A
    const onlyInB = setB.filter(item => !a.has(item));

    // Symmetric Difference: (A ∪ B) - (A ∩ B)
    const symmetricDiff = onlyInA.concat(onlyInB);

    setResults({
      intersection,
      union,
      onlyInA,
      onlyInB,
      symmetricDiff
    });

    setShowResults(true);
  };

  const handleClear = () => {
    setListA('');
    setListB('');
    setResults({
      intersection: [],
      union: [],
      onlyInA: [],
      onlyInB: [],
      symmetricDiff: []
    });
    setShowResults(false);
  };

  const handleSwitch = () => {
    const temp = listA;
    setListA(listB);
    setListB(temp);
    
    // Re-run operations if results were shown
    if (showResults) {
      setTimeout(() => performOperations(), 0);
    }
  };

  const copyToClipboard = async (items: string[]) => {
    try {
      const text = items.join('\n');
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const ResultSection: React.FC<{
    title: string;
    items: string[];
    description: string;
    icon: string;
    color: string;
  }> = ({ title, items, description, icon, color }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className={`text-sm px-2 py-1 rounded-full ${color}`}>
            {items.length}
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(items)}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-3">{description}</p>
      <div className="min-h-[120px] max-h-[200px] overflow-y-auto bg-gray-50 rounded p-3 font-mono text-sm">
        {items.length > 0 ? (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div key={index} className="text-gray-800">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic text-center py-8">
            No items
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">
        🧙‍♂️ List Wizard
      </h2>
      
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="listA" className="block text-sm font-medium text-gray-700">
              List A
            </label>
            <button
              onClick={() => copyToClipboard(parseList(listA))}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <textarea
            id="listA"
            value={listA}
            onChange={(e) => setListA(e.target.value)}
            className="w-full h-[300px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="Enter items (one per line, or comma-separated)&#10;Example:&#10;item1&#10;item2&#10;item3"
          />
          <div className="text-xs text-gray-500 mt-1">
            {parseList(listA).length} unique items
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="listB" className="block text-sm font-medium text-gray-700">
              List B
            </label>
            <button
              onClick={() => copyToClipboard(parseList(listB))}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
          </div>
          <textarea
            id="listB"
            value={listB}
            onChange={(e) => setListB(e.target.value)}
            className="w-full h-[300px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            placeholder="Enter items (one per line, or comma-separated)&#10;Example:&#10;item2&#10;item4&#10;item5"
          />
          <div className="text-xs text-gray-500 mt-1">
            {parseList(listB).length} unique items
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={performOperations}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
        >
          ✨ Perform Magic
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
      </div>

      {/* Results Section */}
      {showResults ? (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            🎩 Magic Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultSection
              title="Intersection"
              items={results.intersection}
              description="Items that exist in both A and B (A ∩ B)"
              icon="🤝"
              color="bg-blue-100 text-blue-800"
            />
            
            <ResultSection
              title="Union"
              items={results.union}
              description="All unique items from both lists (A ∪ B)"
              icon="🔗"
              color="bg-green-100 text-green-800"
            />
            
            <ResultSection
              title="Only in A"
              items={results.onlyInA}
              description="Items that exist only in List A (A - B)"
              icon="🅰️"
              color="bg-red-100 text-red-800"
            />
            
            <ResultSection
              title="Only in B"
              items={results.onlyInB}
              description="Items that exist only in List B (B - A)"
              icon="🅱️"
              color="bg-orange-100 text-orange-800"
            />
            
            <ResultSection
              title="Symmetric Difference"
              items={results.symmetricDiff}
              description="Items that exist in either A or B, but not both (A ⊕ B)"
              icon="⚡"
              color="bg-purple-100 text-purple-800"
            />
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-12">
          <div className="text-lg mb-2">🧙‍♂️ Ready to cast some magic</div>
          <div>Enter your lists above and click "Perform Magic" to see the results</div>
        </div>
      )}
    </div>
  );
};

export default ListWizard; 
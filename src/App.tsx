import React, { useState } from 'react';
import axios from 'axios';
import { Twitter, TrendingUp, MessageCircle, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';

interface SentimentResult {
  score: number;
  positive_words: string[];
  negative_words: string[];
  tokens: string[];
}

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSentiment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('http://localhost:8000/analyze', { text });
      setResult(response.data);
    } catch (err) {
      setError('Failed to analyze sentiment. Please try again.');
      console.error('Error analyzing sentiment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = () => {
    if (!result) return null;
    if (result.score > 0) return <ThumbsUp className="w-8 h-8 text-green-500" />;
    if (result.score < 0) return <ThumbsDown className="w-8 h-8 text-red-500" />;
    return <Meh className="w-8 h-8 text-gray-500" />;
  };

  const getScoreColor = () => {
    if (!result) return 'text-gray-700';
    if (result.score > 0) return 'text-green-600';
    if (result.score < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Twitter className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">Twitter Sentiment Analysis</h1>
          </div>

          <div className="mb-6">
            <textarea
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={analyzeSentiment}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              Analysis Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">{getSentimentEmoji()}</div>
                <p className="text-sm text-gray-600">Sentiment</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className={`text-2xl font-bold ${getScoreColor()}`}>
                  {result.score.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Score</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.tokens.length}</p>
                <p className="text-sm text-gray-600">Words Analyzed</p>
              </div>
            </div>

            {(result.positive_words.length > 0 || result.negative_words.length > 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.positive_words.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Positive Words</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.positive_words.map((word, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.negative_words.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Negative Words</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.negative_words.map((word, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
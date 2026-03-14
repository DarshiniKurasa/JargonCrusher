"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface ResultData {
  meaning?: string;
  key_points?: string[];
  jargon_words?: string[];
  fluff_score?: number;
  buzzword_density?: number;
  tone?: string;
}

// Dictionary
const jargonDictionary = [
  "leverage", "synergy", "paradigm shift", "thought leadership",
  "circle back", "deep dive", "low hanging fruit", "best practice",
  "holistic approach", "move the needle", "bandwidth", "alignment",
  "scalable", "disruptive", "ecosystem", "value proposition"
];

// Patterns
const jargonPatterns = [
  /leverage\s+\w+/gi,
  /strategic\s+\w+/gi,
  /scalable\s+\w+/gi,
  /cross[- ]functional\s+\w+/gi,
  /value[- ]?driven\s+\w+/gi,
  /data[- ]?driven\s+\w+/gi,
  /customer[- ]?centric\s+\w+/gi
];

function getFluffScore(text: string) {
  let matches = 0;
  let topOffenders: string[] = [];
  const lowerText = text.toLowerCase();

  // 1. Dictionary Check
  jargonDictionary.forEach(word => {
    if (lowerText.includes(word)) {
      matches += 1;
      topOffenders.push(word);
    }
  });

  // 2. Pattern Check
  jargonPatterns.forEach(pattern => {
    const found = text.match(pattern);
    if (found) {
      matches += found.length * 2; // Patterns weighted more
      topOffenders.push(...found.map(f => f.toLowerCase()));
    }
  });

  // Unique offenders
  topOffenders = Array.from(new Set(topOffenders));

  // 3. Sentence Complexity
  const words = text.split(" ").length;
  const avgWordsPerSentence = words / (text.split(/[.?!]/).length || 1);
  const complexityScore = avgWordsPerSentence > 20 ? 10 : 0;

  let fluffScore = (matches * 3) + complexityScore;
  fluffScore = Math.min(fluffScore, 100);

  const buzzwordDensity = Math.min(Math.round(((matches) / words) * 100), 100);

  return {
    fluffScore,
    jargonMatches: topOffenders.length,
    buzzwordDensity,
    topOffenders: topOffenders.slice(0, 5)
  };
}

export default function Result() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const text = sessionStorage.getItem("jargon_input");
    if (!text) {
      router.push("/");
      return;
    }

    const fetchResult = async () => {
      try {
        const cleanedText = text
          .replace(/https?:\/\/\S+/g, "")
          .replace(/#[a-zA-Z0-9_]+/g, "")
          .replace(/[^\x00-\x7F]/g, "")
          .trim();

        const { fluffScore, buzzwordDensity, topOffenders } = getFluffScore(cleanedText);

        const res = await fetch("/api/crush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanedText }),
        });

        if (!res.ok) {
          throw new Error("Failed to crush jargon. Try again.");
        }

        const apiData = await res.json();
        const finalData = { ...apiData, buzzword_density: buzzwordDensity, fluff_score: Math.max(fluffScore, apiData.fluff_score || 0) };

        setData(finalData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-xl font-semibold text-neutral-600 animate-pulse">
          Translating corporate speak to English...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <Link href="/" className="text-blue-500 underline">
          Go back
        </Link>
      </div>
    );
  }

  const shareText = `This post scored ${data.fluff_score}% corporate jargon via JargonCrusher.ai`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = (data.fluff_score || 0) > 50 ? "text-red-500" : "text-green-500";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 py-12 px-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <Link href="/" className="inline-block mb-8 text-neutral-500 hover:text-black transition-colors">
          ← Back
        </Link>

        {/* Shareable Card Area */}
        <div id="share-card" className="bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
          {/* Header Stats */}
          <div className="bg-neutral-50 px-6 py-4 flex justify-between items-center border-b border-neutral-200">
            <div>
              <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wider">Fluff Score</span>
              <div className={`text-3xl font-black ${scoreColor}`}>
                {data.fluff_score}%
              </div>
              {data.tone && (
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Tone: <span className="text-neutral-600">{data.tone}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-neutral-500 text-sm font-semibold uppercase tracking-wider">Buzzword Density</span>
              <div className="text-2xl font-bold text-neutral-700">
                {data.buzzword_density}%
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <section>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-2">Original</h3>
              <p className="text-lg text-neutral-500 italic border-l-4 border-neutral-200 pl-4 py-1">
                "{sessionStorage.getItem("jargon_input")}"
              </p>
            </section>

            <div className="border-t border-neutral-200"></div>

            <section>
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Crushed</h3>
              
              {(data.fluff_score !== undefined && data.fluff_score < 10) && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6">
                  <strong className="block mb-1 text-green-900">Verdict: No corporate jargon detected</strong>
                  This post is mostly {data.tone ? data.tone.toLowerCase() : 'clear'} and already written clearly.
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <strong className="text-neutral-800 block mb-1">Meaning:</strong>
                  <p className="text-lg text-neutral-700">
                    {data.meaning}
                  </p>
                </div>

                {data.key_points && data.key_points.length > 0 && (
                  <div>
                    <strong className="text-neutral-800 block mb-2">Key points:</strong>
                    <ul className="space-y-1">
                      {data.key_points.map((pt, i) => (
                        <li key={i} className="flex items-start text-neutral-700">
                          <span className="mr-2">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.jargon_words && data.jargon_words.length > 0 && (
                  <div>
                    <strong className="text-neutral-800 block mb-2">Jargon detected:</strong>
                    <ul className="space-y-1">
                      {data.jargon_words.map((w, i) => (
                        <li key={i} className="flex items-start text-neutral-700">
                          <span className="mr-2">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </div>
          
          <div className="bg-neutral-900 text-center py-3 text-neutral-400 text-xs tracking-widest font-bold uppercase">
            JargonCrusher.ai
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleCopyShare}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md flex justify-center"
          >
            {copied ? "Copied to Clipboard!" : "Copy Share Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

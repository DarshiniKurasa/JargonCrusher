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

export function getFluffScore(text) {
  let matches = 0;
  let topOffenders = [];
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
  topOffenders = [...new Set(topOffenders)];

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

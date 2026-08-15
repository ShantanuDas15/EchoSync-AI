export function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  
  if (q.length === 0) return { match: true, score: 0 };
  
  let qIdx = 0;
  let tIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;
  
  while (qIdx < q.length && tIdx < t.length) {
    if (q[qIdx] === t[tIdx]) {
      score += 10 + consecutiveMatches * 5; // bonus for consecutive matches
      
      // bonus for matching start of string or after a space
      if (tIdx === 0 || t[tIdx - 1] === ' ') {
        score += 15;
      }
      
      consecutiveMatches++;
      qIdx++;
    } else {
      consecutiveMatches = 0;
    }
    tIdx++;
  }
  
  const match = qIdx === q.length;
  if (match) {
    // Penalty for target length to favor shorter strings
    score -= t.length * 0.5;
  }
  
  return {
    match,
    score: match ? score : -1
  };
}

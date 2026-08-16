/** 从局分数组计算大比分（胜局数） */
export function countSetScore(
  sets: { scoreA: number; scoreB: number }[],
): { setsA: number; setsB: number } {
  const setsA = sets.filter((s) => s.scoreA > s.scoreB).length;
  const setsB = sets.filter((s) => s.scoreB > s.scoreA).length;
  return { setsA, setsB };
}

export function formatSetScore(
  sets: { scoreA: number; scoreB: number }[],
): string {
  const { setsA, setsB } = countSetScore(sets);
  return `${setsA} : ${setsB}`;
}

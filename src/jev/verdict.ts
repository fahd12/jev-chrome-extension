/** A post is marked as slop only when the isSlop Noul is above this. */
export const SLOP_THRESHOLD = 0.8;

export function isSlopScore(noul: number): boolean {
  return noul > SLOP_THRESHOLD;
}

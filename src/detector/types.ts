/** Resolves to true when the post text is AI slop. */
export type Detector = (text: string) => Promise<boolean>;

"use client";
// A mounted workspace may review programmatic shell navigation before the
// router starts changing its tree. Other modules retain their existing guards.
let reviewer: ((run: () => void) => void) | null = null;
export function registerNavigationReview(review: (run: () => void) => void) {
  reviewer = review;
  return () => {
    if (reviewer === review) reviewer = null;
  };
}
export function reviewNavigation(run: () => void) {
  if (!reviewer) return false;
  reviewer(run);
  return true;
}
export function navigateWithReview(run: () => void) {
  if (!reviewNavigation(run)) run();
}

export const DEMO_REVIEW_COPY = {
  forbidden: "Cette démonstration est accessible avec le compte doves.demo.",
} as const;

export const demoReviewForbiddenDisplay = () => ({
  message: DEMO_REVIEW_COPY.forbidden,
});

export const demoReviewDocumentDisplay = (html: string) => ({ html });

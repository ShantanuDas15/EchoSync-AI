export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement?: TourPlacement;
  badgeText?: string;
  actionHint?: string;
}

export type TemplateCategory = 'All' | 'Podcast' | 'Audiobook' | 'Gaming' | 'Commercial' | 'Customer Support';

export interface TemplateBlock {
  text: string;
  preset: string;
}

export interface StoryboardTemplate {
  id: string;
  title: string;
  category: 'Podcast' | 'Audiobook' | 'Gaming' | 'Commercial' | 'Customer Support';
  description: string;
  durationEstimate: string;
  speakerCount: number;
  blocks: TemplateBlock[];
  tags: string[];
  recommendedVoice: string;
}

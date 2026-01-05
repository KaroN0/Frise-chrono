
export type LayoutMode = 'horizontal' | 'vertical';

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  imageUrl: string;
  description: string;
}

export interface AppSettings {
  title: string;
  layout: LayoutMode;
  bgColor: string;
  bgImageUrl: string;
  lineColor: string;
}

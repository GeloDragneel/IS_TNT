export type BlockType = 'text' | 'boxed-text' | 'image' | 'image-group' | 'image-card' | 'image-text' | 'button' | 'divider' | 'social' | 'footer' | 'video' | 'columns';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: any;
  styles: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  blocks: EmailBlock[];
  settings: {
    width: number;
    backgroundColor: string;
    fontFamily: string;
  };
}
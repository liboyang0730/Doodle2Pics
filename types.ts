
export interface DrawingState {
  color: string;
  brushSize: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum ToolType {
  BRUSH = 'brush',
  ERASER = 'eraser'
}


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType } from '../types';

interface DrawingCanvasProps {
  color: string;
  brushSize: number;
  tool: ToolType;
  onCanvasChange: (dataUrl: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  color,
  brushSize,
  tool,
  onCanvasChange,
  canvasRef
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Use current content to restore after resize
    const currentData = canvas.toDataURL();
    
    // Explicitly set size from parent
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = tool === ToolType.ERASER ? '#1e293b' : color;
      context.lineWidth = brushSize;
      
      // Fill initial background if it was empty
      if (!isInitialized) {
        context.fillStyle = '#1e293b';
        context.fillRect(0, 0, width, height);
        setIsInitialized(true);
      } else {
        const img = new Image();
        img.onload = () => context.drawImage(img, 0, 0);
        img.src = currentData;
      }
      
      contextRef.current = context;
    }
  }, [canvasRef, color, brushSize, tool, isInitialized]);

  useEffect(() => {
    initCanvas();
    
    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
    });

    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, [initCanvas, canvasRef]);

  // Update context when tools change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = tool === ToolType.ERASER ? '#1e293b' : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, tool]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      };
    } else {
      const mouseEvent = e as React.MouseEvent;
      return {
        offsetX: mouseEvent.nativeEvent.offsetX,
        offsetY: mouseEvent.nativeEvent.offsetY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(coords.offsetX, coords.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    contextRef.current?.lineTo(coords.offsetX, coords.offsetY);
    contextRef.current?.stroke();
  };

  const endDrawing = () => {
    if (isDrawing) {
      contextRef.current?.closePath();
      setIsDrawing(false);
      if (canvasRef.current) {
        onCanvasChange(canvasRef.current.toDataURL());
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
      className="block w-full h-full cursor-crosshair touch-none transition-colors duration-500"
    />
  );
};

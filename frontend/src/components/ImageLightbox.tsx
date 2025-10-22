import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Image {
  id: number;
  path: string;
  type: string;
  rank: string;
}

interface Props {
  images: Image[];
  onClose: () => void;
  startIndex?: number;
}

const ImageLightbox: React.FC<Props> = ({ images, onClose, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const startXRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Drag / Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    setIsDragging(false);
    startXRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (startXRef.current === null) return;
    const diff = startXRef.current - e.clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    setIsDragging(false);
    startXRef.current = null;
  };

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`relative w-full max-w-full mx-auto p-4 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <img
          src={`${import.meta.env.VITE_BASE_URL}${images[currentIndex].path}`}
          alt={`Image ${currentIndex + 1}`}
          className="w-full max-h-[80vh] object-contain rounded"
          draggable={false}
        />
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
        >
          <ChevronLeft className="h-10 w-10" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
        >
          <ChevronRight className="h-10 w-10" />
        </button>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full"
        >
          <X className="h-10 w-10" />
        </button>
      </div>
    </div>
  );
};

export default ImageLightbox;

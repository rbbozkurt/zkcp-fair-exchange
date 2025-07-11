import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: React.ReactNode[];
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  itemWidth = 320,
  gap = 24,
  showArrows = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = itemWidth + gap;
      const targetScroll =
        direction === 'left'
          ? containerRef.current.scrollLeft - scrollAmount
          : containerRef.current.scrollLeft + scrollAmount;

      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  if (children.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white p-3 rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white p-3 rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="carousel-container flex overflow-x-auto space-x-6 pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onScroll={checkScrollButtons}
      >
        {children.map((child, index) => (
          <div key={index} className="flex-shrink-0" style={{ minWidth: `${itemWidth}px` }}>
            {child}
          </div>
        ))}
      </div>

      {/* Add CSS class for webkit scrollbar hiding */}
      <style>
        {`
          .carousel-container::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default Carousel;

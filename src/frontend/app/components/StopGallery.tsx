import React, { useEffect, useRef, useState } from "react";
import { type Stop } from "../data/StopDataProvider";
import StopGalleryItem from "./StopGalleryItem";

interface StopGalleryProps {
  stops: Stop[];
  title: string;
  emptyMessage?: string;
}

const StopGallery: React.FC<StopGalleryProps> = ({
  stops,
  title,
  emptyMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || stops.length === 0) {
      return;
    }

    const handleScroll = () => {
      const scrollLeft = element.scrollLeft;
      const itemWidth = element.scrollWidth / stops.length;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveIndex(index);
    };

    element.addEventListener("scroll", handleScroll);
    return () => element.removeEventListener("scroll", handleScroll);
  }, [stops.length]);

  if (stops.length === 0 && emptyMessage) {
    return (
      <div className="w-full px-4 flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="text-center">
          <p className="text-sm px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  if (stops.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide pb-2"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="flex gap-3">
          {stops.map((stop) => (
            <StopGalleryItem key={stop.stopId} stop={stop} />
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-1">
        {stops.map((_, index) => (
          <span
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${index === activeIndex ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
              }`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default StopGallery;

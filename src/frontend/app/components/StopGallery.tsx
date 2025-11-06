import React, { useRef, useState, useEffect } from "react";
import { type Stop } from "../data/StopDataProvider";
import StopGalleryItem from "./StopGalleryItem";
import "./StopGallery.css";

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
    if (!element) return;

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
      <div className="gallery-container">
        <h2 className="page-subtitle">{title}</h2>
        <p className="message">{emptyMessage}</p>
      </div>
    );
  }

  if (stops.length === 0) {
    return null;
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h2 className="page-subtitle">{title}</h2>
        <span className="gallery-counter">{stops.length}</span>
      </div>

      <div className="gallery-scroll-container" ref={scrollRef}>
        <div className="gallery-track">
          {stops.map((stop) => (
            <StopGalleryItem key={stop.stopId} stop={stop} />
          ))}
        </div>
      </div>

      {stops.length > 1 && (
        <div className="gallery-indicators">
          {stops.map((_, index) => (
            <div
              key={index}
              className={`gallery-indicator ${index === activeIndex ? "active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StopGallery;

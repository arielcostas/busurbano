import React, { useEffect, useRef, useState } from "react";
import { type Stop } from "../data/StopDataProvider";
import "./StopGallery.css";
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
      <div className="gallery-container stoplist-section">
        <h3 className="page-subtitle">{title}</h3>
        <div className="gallery-empty-state">
          <p className="message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (stops.length === 0) {
    return null;
  }

  return (
    <div className="gallery-container stoplist-section">
      <div className="gallery-header">
        <h3 className="page-subtitle">{title}</h3>
        <span className="gallery-counter">{stops.length}</span>
      </div>

      <div ref={scrollRef} className="gallery-scroll-container">
        <div className="gallery-track">
          {stops.map((stop) => (
            <StopGalleryItem key={stop.stopId} stop={stop} />
          ))}
        </div>
      </div>
      <div className="gallery-dots">
        {stops.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === activeIndex ? "active" : ""}`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default StopGallery;

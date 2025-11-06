import React, { useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { type Stop } from "../data/StopDataProvider";
import StopGalleryItem from "./StopGalleryItem";
import "./StopGallery.css";

interface StopGalleryProps {
  stops: Stop[];
  title: string;
  emptyMessage?: string;
}

const StopGallery: React.FC<StopGalleryProps> = ({ stops, title, emptyMessage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

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
      
      <motion.div 
        className="gallery-scroll-container"
        ref={scrollRef}
        style={{ x }}
      >
        <div className="gallery-track">
          {stops.map((stop) => (
            <StopGalleryItem key={stop.stopId} stop={stop} />
          ))}
        </div>
      </motion.div>

      <div className="gallery-indicators">
        {stops.map((_, index) => (
          <div key={index} className="gallery-indicator" />
        ))}
      </div>
    </div>
  );
};

export default StopGallery;

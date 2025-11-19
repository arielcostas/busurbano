import React from "react";
import "./PageContainer.css";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
}) => {
  return <div className={`page-container ${className}`}>{children}</div>;
};

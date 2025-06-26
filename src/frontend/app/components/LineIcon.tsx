import React from "react";
import "./LineIcon.css";

interface LineIconProps {
  line: string;
}

const LineIcon: React.FC<LineIconProps> = ({ line }) => {
  const formattedLine = /^[a-zA-Z]/.test(line) ? line : `L${line}`;
  return (
    <span className={`line-icon line-${formattedLine.toLowerCase()}`}>
      {formattedLine}
    </span>
  );
};

export default LineIcon;

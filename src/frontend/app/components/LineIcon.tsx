import React, { useMemo } from "react";
import "./LineIcon.css";
import { type RegionId } from "../data/RegionConfig";

interface LineIconProps {
  line: string;
  region?: RegionId;
}

const LineIcon: React.FC<LineIconProps> = ({ line, region = "vigo" }) => {
  const formattedLine = useMemo(() => {
    return /^[a-zA-Z]/.test(line) ? line : `L${line}`;
  }, [line]);
  const cssVarName = `--line-${region}-${formattedLine.toLowerCase()}`;

  return (
    <span
      className="line-icon"
      style={{ borderColor: `var(${cssVarName})` }}
    >
      {formattedLine}
    </span>
  );
};

export default LineIcon;

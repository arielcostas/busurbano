import React, { useMemo } from "react";
import { type RegionId } from "../config/RegionConfig";
import "./LineIcon.css";

interface LineIconProps {
  line: string;
  region?: RegionId;
  rounded?: boolean;
}

const LineIcon: React.FC<LineIconProps> = ({
  line,
  region = "vigo",
  rounded = false,
}) => {
  const formattedLine = useMemo(() => {
    return /^[a-zA-Z]/.test(line) ? line : `L${line}`;
  }, [line]);
  const cssVarName = `--line-${region}-${formattedLine.toLowerCase()}`;
  const cssTextVarName = `--line-${region}-${formattedLine.toLowerCase()}-text`;

  return (
    <span
      className={rounded ? "line-icon-rounded" : "line-icon"}
      style={
        {
          "--line-colour": `var(${cssVarName})`,
          "--line-text-colour": `var(${cssTextVarName}, #000000)`,
        } as React.CSSProperties
      }
    >
      {line}
    </span>
  );
};

export default LineIcon;

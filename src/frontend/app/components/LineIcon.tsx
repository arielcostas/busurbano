import React, { useMemo } from "react";
import "./LineIcon.css";
import { type RegionId } from "../data/RegionConfig";

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
          "--line-text-colour": `var(${cssTextVarName}, unset)`,
        } as React.CSSProperties
      }
    >
      {line}
    </span>
  );
};

export default LineIcon;

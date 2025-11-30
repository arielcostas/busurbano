import React, { useMemo } from "react";
import { type RegionId } from "../config/RegionConfig";
import "./LineIcon.css";

interface LineIconProps {
  line: string;

  /**
   * @deprecated Unused since region is only Vigo
   */
  region?: RegionId;

  mode?: "rounded"|"pill"|"default";
}

const LineIcon: React.FC<LineIconProps> = ({
  line,
  mode = "default",
}) => {
  const formattedLine = useMemo(() => {
    return /^[a-zA-Z]/.test(line) ? line : `L${line}`;
  }, [line]);
  const cssVarName = `--line-${formattedLine.toLowerCase()}`;
  const cssTextVarName = `--line-${formattedLine.toLowerCase()}-text`;

  return (
    <span
      className={`line-icon-${mode}`}
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

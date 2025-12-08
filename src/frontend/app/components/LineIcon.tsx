import React, { useMemo } from "react";
import "./LineIcon.css";

interface LineIconProps {
  line: string;
  mode?: "rounded" | "pill" | "default";
}

const LineIcon: React.FC<LineIconProps> = ({ line, mode = "default" }) => {
  const actualLine = useMemo(() => {
    return line.trim().replace("510", "NAD");
  }, [line]);

  const formattedLine = useMemo(() => {
    return /^[a-zA-Z]/.test(actualLine) ? actualLine : `L${actualLine}`;
  }, [actualLine]);

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
      {actualLine}
    </span>
  );
};

export default LineIcon;

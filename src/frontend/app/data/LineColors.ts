interface LineColorInfo {
  background: string;
  text: string;
}

const vigoLineColors: Record<string, LineColorInfo> = {
  c1: { background: "rgb(237, 71, 19)", text: "#ffffff" },
  c3d: { background: "rgb(255, 204, 0)", text: "#000000" },
  c3i: { background: "rgb(255, 204, 0)", text: "#000000" },
  l4a: { background: "rgb(0, 153, 0)", text: "#ffffff" },
  l4c: { background: "rgb(0, 153, 0)", text: "#ffffff" },
  l5a: { background: "rgb(0, 176, 240)", text: "#000000" },
  l5b: { background: "rgb(0, 176, 240)", text: "#000000" },
  l6: { background: "rgb(204, 51, 153)", text: "#ffffff" },
  l7: { background: "rgb(150, 220, 153)", text: "#000000" },
  l9b: { background: "rgb(244, 202, 140)", text: "#000000" },
  l10: { background: "rgb(153, 51, 0)", text: "#ffffff" },
  l11: { background: "rgb(226, 0, 38)", text: "#ffffff" },
  l12a: { background: "rgb(106, 150, 190)", text: "#000000" },
  l12b: { background: "rgb(106, 150, 190)", text: "#000000" },
  l13: { background: "rgb(0, 176, 240)", text: "#000000" },
  l14: { background: "rgb(129, 142, 126)", text: "#ffffff" },
  l15a: { background: "rgb(216, 168, 206)", text: "#000000" },
  l15b: { background: "rgb(216, 168, 206)", text: "#000000" },
  l15c: { background: "rgb(216, 168, 168)", text: "#000000" },
  l16: { background: "rgb(129, 142, 126)", text: "#ffffff" },
  l17: { background: "rgb(214, 245, 31)", text: "#000000" },
  l18a: { background: "rgb(212, 80, 168)", text: "#ffffff" },
  l18b: { background: "rgb(212, 80, 168)", text: "#ffffff" },
  l18h: { background: "rgb(212, 80, 168)", text: "#ffffff" },
  l23: { background: "rgb(0, 70, 210)", text: "#ffffff" },
  l24: { background: "rgb(191, 191, 191)", text: "#000000" },
  l25: { background: "rgb(172, 100, 4)", text: "#ffffff" },
  l27: { background: "rgb(112, 74, 42)", text: "#ffffff" },
  l28: { background: "rgb(176, 189, 254)", text: "#000000" },
  l29: { background: "rgb(248, 184, 90)", text: "#000000" },
  l31: { background: "rgb(255, 255, 0)", text: "#000000" },
  a: { background: "rgb(119, 41, 143)", text: "#ffffff" },
  h: { background: "rgb(0, 96, 168)", text: "#ffffff" },
  h1: { background: "rgb(0, 96, 168)", text: "#ffffff" },
  h2: { background: "rgb(0, 96, 168)", text: "#ffffff" },
  h3: { background: "rgb(0, 96, 168)", text: "#ffffff" },
  lzd: { background: "rgb(61, 78, 167)", text: "#ffffff" },
  n1: { background: "rgb(191, 191, 191)", text: "#000000" },
  n4: { background: "rgb(102, 51, 102)", text: "#ffffff" },
  psa1: { background: "rgb(0, 153, 0)", text: "#ffffff" },
  psa4: { background: "rgb(0, 153, 0)", text: "#ffffff" },
  ptl: { background: "rgb(150, 220, 153)", text: "#000000" },
  turistico: { background: "rgb(102, 51, 102)", text: "#ffffff" },
  u1: { background: "rgb(172, 100, 4)", text: "#ffffff" },
  u2: { background: "rgb(172, 100, 4)", text: "#ffffff" },
};

const defaultLineColor: LineColorInfo = {
  background: "#d32f2f",
  text: "#ffffff",
};

export function getLineColour(line: string): LineColorInfo {
  let formattedLine = /^[a-zA-Z]/.test(line) ? line : `L${line}`;
  formattedLine = formattedLine.toLowerCase().trim();

  return vigoLineColors[formattedLine.toLowerCase().trim()] ?? defaultLineColor;
}

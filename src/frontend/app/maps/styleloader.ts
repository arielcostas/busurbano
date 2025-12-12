import type { StyleSpecification } from "react-map-gl/maplibre";
import type { Theme } from "~/AppContext";

export interface StyleLoaderOptions {
  includeTraffic?: boolean;
}

export const DEFAULT_STYLE: StyleSpecification = {
  version: 8,
  glyphs: `${window.location.origin}/maps/fonts/{fontstack}/{range}.pbf`,
  sprite: `${window.location.origin}/maps/spritesheet/sprite`,
  sources: {},
  layers: [],
};

export async function loadStyle(
  styleName: string,
  colorScheme: Theme,
  options?: StyleLoaderOptions
): Promise<StyleSpecification> {
  const { includeTraffic = true } = options || {};

  if (colorScheme == "system") {
    const isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    colorScheme = isDarkMode ? "dark" : "light";
  }

  if (styleName == "openfreemap") {
    const url = `/maps/styles/openfreemap-${colorScheme}.json`;

    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load style: ${url}`);
    }

    const style = await resp.json();

    // Remove traffic layers if not requested
    if (!includeTraffic) {
      style.layers = (style.layers || []).filter(
        (layer: any) => !layer.id?.startsWith("vigo_traffic")
      );
      delete style.sources?.vigo_traffic;
    }

    return style as StyleSpecification;
  }

  const stylePath = `/maps/styles/${styleName}-${colorScheme}.json`;
  const resp = await fetch(stylePath);

  if (!resp.ok) {
    throw new Error(`Failed to load style: ${stylePath}`);
  }

  const style = await resp.json();

  // Remove traffic layers if not requested
  if (!includeTraffic) {
    style.layers = (style.layers || []).filter(
      (layer: any) => !layer.id?.startsWith("vigo_traffic")
    );
    delete style.sources?.vigo_traffic;
  }

  const baseUrl = window.location.origin;
  const spritePath = style.sprite;

  // Handle both string and array cases for spritePath
  if (Array.isArray(spritePath)) {
    // For array format, update each sprite object's URL to be absolute
    style.sprite = spritePath.map((spriteObj) => {
      const isAbsoluteUrl =
        spriteObj.url.startsWith("http://") ||
        spriteObj.url.startsWith("https://");
      if (isAbsoluteUrl) {
        return spriteObj;
      }

      return {
        ...spriteObj,
        url: `${baseUrl}${spriteObj.url}`,
      };
    });
  } else if (typeof spritePath === "string") {
    if (
      !spritePath.startsWith("http://") &&
      !spritePath.startsWith("https://")
    ) {
      style.sprite = `${baseUrl}${spritePath}`;
    }
  }

  // Detect on each source if it the 'tiles' URLs are relative and convert them to absolute URLs
  for (const sourceKey in style.sources) {
    const source = style.sources[sourceKey];
    for (const tileKey in source.tiles) {
      const tileUrl = source.tiles[tileKey];
      const isAbsoluteUrl =
        tileUrl.startsWith("http://") || tileUrl.startsWith("https://");
      if (!isAbsoluteUrl) {
        source.tiles[tileKey] = `${baseUrl}${tileUrl}`;
      }
    }
  }

  return style as StyleSpecification;
}

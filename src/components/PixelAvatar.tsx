// Pixel art avatar rendering - 8-bit style character builder
// Each part is a simple pixel grid rendered as an SVG

export type AvatarSkin = "light" | "tan" | "brown" | "dark";
export type AvatarHair = "spiky" | "long" | "mohawk" | "bald" | "ponytail";
export type AvatarHairColor = "black" | "brown" | "blonde" | "red" | "blue" | "white";
export type AvatarEyes = "normal" | "angry" | "happy" | "cool";
export type AvatarArmor = "none" | "leather" | "chainmail" | "plate" | "mage_robe" | "shadow" | "dragon";
export type AvatarWeapon = "none" | "sword" | "staff" | "bow" | "axe" | "dagger" | "hammer";

export interface AvatarConfig {
  skin: AvatarSkin;
  hair: AvatarHair;
  hairColor: AvatarHairColor;
  eyes: AvatarEyes;
  armor: AvatarArmor;
  weapon: AvatarWeapon;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "light",
  hair: "spiky",
  hairColor: "brown",
  eyes: "normal",
  armor: "none",
  weapon: "none",
};

const SKIN_COLORS: Record<AvatarSkin, string> = {
  light: "#FFDCB0",
  tan: "#D4A574",
  brown: "#8B6F47",
  dark: "#5C3D2E",
};

const HAIR_COLORS: Record<AvatarHairColor, string> = {
  black: "#1A1A1A",
  brown: "#5C3317",
  blonde: "#E8D44D",
  red: "#C0392B",
  blue: "#2E86C1",
  white: "#ECF0F1",
};

const ARMOR_COLORS: Record<AvatarArmor, { primary: string; secondary: string }> = {
  none: { primary: "#808080", secondary: "#666" },
  leather: { primary: "#8B4513", secondary: "#A0522D" },
  chainmail: { primary: "#A0A0A0", secondary: "#C0C0C0" },
  plate: { primary: "#4A4A4A", secondary: "#6A6A6A" },
  mage_robe: { primary: "#4A148C", secondary: "#6A1B9A" },
  shadow: { primary: "#1A1A2E", secondary: "#16213E" },
  dragon: { primary: "#B71C1C", secondary: "#D32F2F" },
};

const WEAPON_SHAPES: Record<AvatarWeapon, string> = {
  none: "",
  sword: "M2,0 L2,8 L1,9 L3,9 L2,8 M1,2 L3,2",
  staff: "M2,0 L2,10 M1,0 L3,0 M0,1 L4,1",
  bow: "M0,1 Q2,0 4,1 M0,1 L0,7 Q2,8 4,7 L4,1 M2,1 L2,8",
  axe: "M2,0 L2,8 M0,2 L4,2 L4,4 L2,4",
  dagger: "M2,2 L2,7 L1,8 L3,8 L2,7 M1,3 L3,3",
  hammer: "M2,0 L2,8 M0,0 L4,0 L4,3 L0,3 Z",
};

interface PixelAvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

function drawPixel(x: number, y: number, color: string, pixelSize: number): string {
  return `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
}

export function PixelAvatar({ config, size = 128, className = "" }: PixelAvatarProps) {
  const ps = size / 16; // pixel size (16x16 grid)
  const skin = SKIN_COLORS[config.skin];
  const hair = HAIR_COLORS[config.hairColor];
  const armor = ARMOR_COLORS[config.armor];

  // Build pixel grid
  let pixels = "";

  // Body (simple tunic/armor) - rows 9-14
  for (let x = 5; x <= 10; x++) {
    for (let y = 9; y <= 13; y++) {
      pixels += drawPixel(x, y, config.armor === "none" ? "#808080" : armor.primary, ps);
    }
  }
  // Shoulders
  for (let x = 4; x <= 11; x++) {
    pixels += drawPixel(x, 9, config.armor === "none" ? "#666" : armor.secondary, ps);
  }

  // Head (skin) - rows 3-8
  for (let x = 6; x <= 9; x++) {
    for (let y = 4; y <= 8; y++) {
      pixels += drawPixel(x, y, skin, ps);
    }
  }
  // Wider face
  pixels += drawPixel(5, 5, skin, ps);
  pixels += drawPixel(5, 6, skin, ps);
  pixels += drawPixel(5, 7, skin, ps);
  pixels += drawPixel(10, 5, skin, ps);
  pixels += drawPixel(10, 6, skin, ps);
  pixels += drawPixel(10, 7, skin, ps);

  // Eyes
  const eyeColor = config.eyes === "cool" ? "#2196F3" : "#1A1A1A";
  pixels += drawPixel(7, 6, eyeColor, ps);
  pixels += drawPixel(8, 6, eyeColor, ps);
  if (config.eyes === "happy") {
    // Curved eyes
  } else if (config.eyes === "angry") {
    pixels += drawPixel(6, 5, "#1A1A1A", ps);
    pixels += drawPixel(9, 5, "#1A1A1A", ps);
  }

  // Mouth
  pixels += drawPixel(7, 7, "#C0392B", ps);
  pixels += drawPixel(8, 7, "#C0392B", ps);

  // Hair
  if (config.hair === "spiky") {
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 3, hair, ps);
    pixels += drawPixel(5, 2, hair, ps);
    pixels += drawPixel(7, 1, hair, ps);
    pixels += drawPixel(9, 2, hair, ps);
    pixels += drawPixel(10, 3, hair, ps);
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 4, hair, ps);
  } else if (config.hair === "long") {
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 3, hair, ps);
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 4, hair, ps);
    pixels += drawPixel(4, 4, hair, ps);
    pixels += drawPixel(4, 5, hair, ps);
    pixels += drawPixel(4, 6, hair, ps);
    pixels += drawPixel(4, 7, hair, ps);
    pixels += drawPixel(4, 8, hair, ps);
    pixels += drawPixel(11, 4, hair, ps);
    pixels += drawPixel(11, 5, hair, ps);
    pixels += drawPixel(11, 6, hair, ps);
    pixels += drawPixel(11, 7, hair, ps);
    pixels += drawPixel(11, 8, hair, ps);
  } else if (config.hair === "mohawk") {
    pixels += drawPixel(7, 1, hair, ps);
    pixels += drawPixel(8, 1, hair, ps);
    pixels += drawPixel(7, 2, hair, ps);
    pixels += drawPixel(8, 2, hair, ps);
    pixels += drawPixel(7, 3, hair, ps);
    pixels += drawPixel(8, 3, hair, ps);
    for (let x = 6; x <= 9; x++) pixels += drawPixel(x, 4, hair, ps);
  } else if (config.hair === "ponytail") {
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 3, hair, ps);
    for (let x = 5; x <= 10; x++) pixels += drawPixel(x, 4, hair, ps);
    pixels += drawPixel(11, 4, hair, ps);
    pixels += drawPixel(12, 5, hair, ps);
    pixels += drawPixel(12, 6, hair, ps);
    pixels += drawPixel(12, 7, hair, ps);
  }
  // bald = no hair pixels

  // Arms
  pixels += drawPixel(4, 10, skin, ps);
  pixels += drawPixel(4, 11, skin, ps);
  pixels += drawPixel(11, 10, skin, ps);
  pixels += drawPixel(11, 11, skin, ps);

  // Legs
  pixels += drawPixel(6, 14, "#333", ps);
  pixels += drawPixel(7, 14, "#333", ps);
  pixels += drawPixel(8, 14, "#333", ps);
  pixels += drawPixel(9, 14, "#333", ps);
  pixels += drawPixel(6, 15, "#222", ps);
  pixels += drawPixel(7, 15, "#222", ps);
  pixels += drawPixel(8, 15, "#222", ps);
  pixels += drawPixel(9, 15, "#222", ps);

  // Weapon (right side)
  if (config.weapon !== "none") {
    const wc = config.weapon === "staff" ? "#8B4513" : config.weapon === "bow" ? "#8B4513" : "#A0A0A0";
    pixels += drawPixel(12, 8, wc, ps);
    pixels += drawPixel(12, 9, wc, ps);
    pixels += drawPixel(12, 10, wc, ps);
    pixels += drawPixel(12, 11, wc, ps);
    pixels += drawPixel(12, 12, wc, ps);
    if (config.weapon === "sword" || config.weapon === "axe" || config.weapon === "hammer") {
      pixels += drawPixel(12, 7, "#FFD700", ps); // hilt
      pixels += drawPixel(11, 8, "#FFD700", ps);
      pixels += drawPixel(13, 8, "#FFD700", ps);
    }
    if (config.weapon === "axe") {
      pixels += drawPixel(13, 9, wc, ps);
      pixels += drawPixel(13, 10, wc, ps);
    }
    if (config.weapon === "hammer") {
      pixels += drawPixel(11, 9, wc, ps);
      pixels += drawPixel(13, 9, wc, ps);
      pixels += drawPixel(11, 10, wc, ps);
      pixels += drawPixel(13, 10, wc, ps);
    }
    if (config.weapon === "staff") {
      pixels += drawPixel(12, 6, "#9B59B6", ps);
      pixels += drawPixel(12, 7, "#9B59B6", ps);
    }
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${pixels}</svg>`;

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

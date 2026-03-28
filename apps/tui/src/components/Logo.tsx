import React from "react";
import { Box } from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import { PALETTES, type PaletteName } from "oh-my-logo";

interface LogoProps {
  text?: string;
  font?: React.ComponentProps<typeof BigText>["font"];
  palette?: PaletteName | string[];
  letterSpacing?: number;
}

/**
 * Gradient ASCII logo using ink-big-text + ink-gradient with oh-my-logo palettes.
 */
export const Logo: React.FC<LogoProps> = ({
  text = "KERYX",
  font = "block",
  palette = "dawn",
  letterSpacing = 1,
}) => {
  // Resolve palette: use array directly, or lookup from PALETTES
  const colors = Array.isArray(palette) ? palette : (PALETTES[palette] ?? PALETTES["dawn"]);

  return (
    <Box flexDirection="column" alignItems="center">
      <Gradient colors={[...colors]}>
        <BigText text={text} font={font} letterSpacing={letterSpacing} />
      </Gradient>
    </Box>
  );
};

export default Logo;

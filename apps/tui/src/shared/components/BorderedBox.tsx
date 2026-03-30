import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { COLORS } from "../theme/colors.js";

type BorderStyle = "single" | "double" | "round" | "bold" | "classic";

interface BorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

const BORDER_STYLES: Record<BorderStyle, BorderChars> = {
  single: {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    horizontal: "─",
    vertical: "│",
  },
  double: {
    topLeft: "╔",
    topRight: "╗",
    bottomLeft: "╚",
    bottomRight: "╝",
    horizontal: "═",
    vertical: "║",
  },
  round: {
    topLeft: "╭",
    topRight: "╮",
    bottomLeft: "╰",
    bottomRight: "╯",
    horizontal: "─",
    vertical: "│",
  },
  bold: {
    topLeft: "┏",
    topRight: "┓",
    bottomLeft: "┗",
    bottomRight: "┛",
    horizontal: "━",
    vertical: "┃",
  },
  classic: {
    topLeft: "+",
    topRight: "+",
    bottomLeft: "+",
    bottomRight: "+",
    horizontal: "-",
    vertical: "|",
  },
};

interface BorderedBoxProps {
  title?: string;
  width: number;
  borderStyle?: BorderStyle;
  borderColor?: string;
  titleColor?: string;
  isFocused?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable bordered container with optional title
 * Supports multiple border styles and focus highlighting
 */
export const BorderedBox: React.FC<BorderedBoxProps> = ({
  title,
  width,
  borderStyle = "single",
  borderColor,
  titleColor,
  isFocused = false,
  children,
}) => {
  const chars = BORDER_STYLES[borderStyle];
  const innerWidth = width - 2;
  const activeColor = isFocused ? COLORS.borderFocus : (borderColor ?? COLORS.border);
  const activeTitleColor = titleColor ?? (isFocused ? COLORS.primary : COLORS.text);

  const topBorder = useMemo(() => {
    if (!title) {
      return `${chars.topLeft}${chars.horizontal.repeat(innerWidth)}${chars.topRight}`;
    }
    const titleText = ` ${title} `;
    const remaining = innerWidth - titleText.length - 1;
    return `${chars.topLeft}${chars.horizontal}${titleText}${chars.horizontal.repeat(Math.max(0, remaining))}${chars.topRight}`;
  }, [title, innerWidth, chars]);

  const bottomBorder = `${chars.bottomLeft}${chars.horizontal.repeat(innerWidth)}${chars.bottomRight}`;

  return (
    <Box flexDirection="column">
      <Text color={activeColor}>
        {title ? (
          <>
            <Text color={activeColor}>{chars.topLeft}{chars.horizontal}</Text>
            <Text color={activeTitleColor}> {title} </Text>
            <Text color={activeColor}>{chars.horizontal.repeat(Math.max(0, innerWidth - title.length - 3))}{chars.topRight}</Text>
          </>
        ) : (
          topBorder
        )}
      </Text>
      <Box flexDirection="column">
        {React.Children.map(children, (child) => (
          <Box>
            <Text color={activeColor}>{chars.vertical}</Text>
            <Box width={innerWidth}>{child}</Box>
            <Text color={activeColor}>{chars.vertical}</Text>
          </Box>
        ))}
      </Box>
      <Text color={activeColor}>{bottomBorder}</Text>
    </Box>
  );
};

export default BorderedBox;

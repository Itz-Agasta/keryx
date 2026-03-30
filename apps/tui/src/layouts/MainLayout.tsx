import React, { useMemo, type ReactNode } from "react";
import { Box } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { COLORS } from "../shared/theme/colors.js";

interface MainLayoutProps {
  /** Left panel content (tree) */
  left: ReactNode;
  /** Right panel content (data) */
  right: ReactNode;
  /** Header content */
  header?: ReactNode;
  /** Footer content (keyboard hints) */
  footer?: ReactNode;
  /** Bottom panel content (query panel when open) */
  bottom?: ReactNode;
  /** Height of the bottom panel when visible */
  bottomHeight?: number;
  /** Whether bottom panel is visible */
  showBottom?: boolean;
  /** Minimum width to show left panel */
  minWidthForSidebar?: number;
  /** Whether left panel is focused */
  leftFocused?: boolean;
  /** Whether right panel is focused */
  rightFocused?: boolean;
}

interface LayoutDimensions {
  leftWidth: number;
  rightWidth: number;
  mainHeight: number;
  showSidebar: boolean;
}

/**
 * Responsive split-pane layout for the main application view
 * 
 * Layout structure:
 * ┌─────────────────────────────────────────────────┐
 * │                    Header                       │
 * ├─────────────┬───────────────────────────────────┤
 * │             │                                   │
 * │    Left     │             Right                 │
 * │   (30%)     │             (70%)                 │
 * │             │                                   │
 * ├─────────────┴───────────────────────────────────┤
 * │                   Bottom                        │
 * │               (Query Panel)                     │
 * ├─────────────────────────────────────────────────┤
 * │                    Footer                       │
 * └─────────────────────────────────────────────────┘
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  left,
  right,
  header,
  footer,
  bottom,
  bottomHeight = 6,
  showBottom = false,
  minWidthForSidebar = 60,
  leftFocused = false,
  rightFocused = false,
}) => {
  const { width, height } = useScreenSize();

  const dimensions = useMemo((): LayoutDimensions => {
    const showSidebar = width >= minWidthForSidebar;
    
    // ═══════════════════════════════════════════════════════════════════════
    // TREE PANEL WIDTH CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    // To change the tree panel width, modify these values:
    //   - 0.20 = 20% of screen width (percentage)
    //   - Math.max(18, ...) = minimum width of 18 characters
    //   - Math.min(..., 30) = maximum width of 30 characters
    // ═══════════════════════════════════════════════════════════════════════
    let leftWidth = 0;
    if (showSidebar) {
      leftWidth = Math.floor(width * 0.20);  // 20% of screen width
      leftWidth = Math.max(18, Math.min(leftWidth, 30));  // min 18, max 30
    }

    const rightWidth = width - leftWidth;

    // Calculate main content height
    // Subtract: header (2 lines), footer (1 line), bottom panel if visible
    const headerHeight = header ? 2 : 0;
    const footerHeight = footer ? 1 : 0;
    const bottomPanelHeight = showBottom ? bottomHeight : 0;
    const mainHeight = height - headerHeight - footerHeight - bottomPanelHeight;

    return {
      leftWidth,
      rightWidth,
      mainHeight: Math.max(5, mainHeight),
      showSidebar,
    };
  }, [width, height, minWidthForSidebar, showBottom, bottomHeight, header, footer]);

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      {header && (
        <Box flexShrink={0}>
          {header}
        </Box>
      )}

      {/* Main content area */}
      <Box flexDirection="row" height={dimensions.mainHeight}>
        {/* Left panel (tree) */}
        {dimensions.showSidebar && (
          <Box 
            width={dimensions.leftWidth} 
            height={dimensions.mainHeight}
            flexShrink={0}
            borderStyle="single"
            borderColor={leftFocused ? COLORS.borderFocus : COLORS.border}
          >
            {left}
          </Box>
        )}

        {/* Right panel (data) */}
        <Box 
          flexGrow={1} 
          height={dimensions.mainHeight}
          borderStyle="single"
          borderColor={rightFocused ? COLORS.borderFocus : COLORS.border}
        >
          {right}
        </Box>
      </Box>

      {/* Bottom panel (query) */}
      {showBottom && bottom && (
        <Box 
          height={bottomHeight} 
          flexShrink={0}
        >
          {bottom}
        </Box>
      )}

      {/* Footer */}
      {footer && (
        <Box flexShrink={0} width={width} justifyContent="center">
          {footer}
        </Box>
      )}
    </Box>
  );
};

export default MainLayout;

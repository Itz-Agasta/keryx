import React, { useMemo, type ReactNode } from "react";
import { Box } from "ink";
import { useScreenSize } from "fullscreen-ink";

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
}) => {
  const { width, height } = useScreenSize();

  const dimensions = useMemo((): LayoutDimensions => {
    const showSidebar = width >= minWidthForSidebar;
    
    // Calculate left panel width (30% with min/max constraints)
    let leftWidth = 0;
    if (showSidebar) {
      leftWidth = Math.floor(width * 0.3);
      leftWidth = Math.max(20, Math.min(40, leftWidth));
    }

    const rightWidth = width - leftWidth;

    // Calculate main content height
    // Subtract: header (1-2 lines), footer (1 line), bottom panel if visible
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
      <Box flexDirection="row" flexGrow={1} height={dimensions.mainHeight}>
        {/* Left panel (tree) */}
        {dimensions.showSidebar && (
          <Box 
            width={dimensions.leftWidth} 
            height={dimensions.mainHeight}
            flexShrink={0}
          >
            {left}
          </Box>
        )}

        {/* Right panel (data) */}
        <Box 
          flexGrow={1} 
          height={dimensions.mainHeight}
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

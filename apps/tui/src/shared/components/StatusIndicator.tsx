import React from "react";
import { Box, Text } from "ink";
import { STATUS_COLORS, type StatusType } from "../theme/colors.js";

interface StatusIndicatorProps {
  status: StatusType;
  latency?: number;
  showLabel?: boolean;
}

/**
 * Connection status indicator with latency display
 * 
 * Examples:
 * - [●] Online 45ms  (green, healthy)
 * - [◐] Slow 234ms   (yellow, high latency)
 * - [○] Offline      (red, disconnected)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  latency,
  showLabel = true,
}) => {
  const config = STATUS_COLORS[status];

  // Determine if latency is concerning
  const latencyColor =
    latency !== undefined
      ? latency > 200
        ? "yellow"
        : latency > 500
          ? "red"
          : "gray"
      : "gray";

  return (
    <Box>
      <Text color={config.color}>[{config.dot}]</Text>
      {showLabel && (
        <Text color={config.color}> {config.label}</Text>
      )}
      {latency !== undefined && (
        <Text color={latencyColor}> {latency}ms</Text>
      )}
    </Box>
  );
};

export default StatusIndicator;

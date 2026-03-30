import React from "react";
import { Box, Text, Spacer } from "ink";
import { useScreenSize } from "fullscreen-ink";
import { StatusIndicator } from "../../../shared/components/StatusIndicator.js";
import { COLORS } from "../../../shared/theme/colors.js";
import type { StatusType } from "../../../shared/theme/colors.js";

interface TableHeaderProps {
  appName?: string;
  database?: string;
  host?: string;
  port?: number;
  user?: string;
  latency?: number;
  status?: StatusType;
}

/**
 * Application header bar with connection info and status
 * 
 * Layout:
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║ KERYX │ mydb@localhost:5432                               [●] Online  45ms ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 */
export const TableHeader: React.FC<TableHeaderProps> = ({
  appName = "KERYX",
  database,
  host,
  port,
  user,
  latency,
  status = "online",
}) => {
  // Build connection string
  const connectionParts: string[] = [];
  if (database) connectionParts.push(database);
  if (host) {
    const hostStr = port ? `${host}:${port}` : host;
    connectionParts.push(`@${hostStr}`);
  }
  const connectionString = connectionParts.join("");

  return (
    <Box flexDirection="column">
      {/* Header bar */}
      <Box paddingX={1}>
        {/* App name */}
        <Text color={COLORS.primary} bold>
          {appName}
        </Text>

        {/* Separator */}
        {connectionString && (
          <>
            <Text color={COLORS.border}> │ </Text>
            <Text color={COLORS.text}>{connectionString}</Text>
          </>
        )}

        {/* User info */}
        {user && (
          <>
            <Text color={COLORS.textMuted}> ({user})</Text>
          </>
        )}

        {/* Push status to the right */}
        <Spacer />

        {/* Connection status */}
        <StatusIndicator status={status} latency={latency} />
      </Box>

      {/* Separator line */}
      <Box>
        <Text color={COLORS.border}>
          {"─".repeat(process.stdout.columns || 80)}
        </Text>
      </Box>
    </Box>
  );
};

export default TableHeader;

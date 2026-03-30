import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useStdin, useInput } from "ink";
import { BackendClient } from "./hooks/useBackend.js";
import { LoginScreen } from "./features/login/LoginScreen.js";
import { BrowseView } from "./features/browse/BrowseView.js";
import type { ConnectRequest, ConnectionInfo } from "./types/index.js";

type AppState = "starting" | "connecting" | "connected" | "error";

const App: React.FC = () => {
  const { isRawModeSupported } = useStdin();
  const [backend] = useState(() => new BackendClient());
  const [state, setState] = useState<AppState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await backend.start();
        setState("connecting");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start backend");
        setState("error");
      }
    };

    init();

    return () => {
      backend.stop();
    };
  }, [backend]);

  const handleConnect = useCallback(
    async (config: ConnectRequest) => {
      setIsConnecting(true);
      setError(null);

      try {
        const response = await backend.send({
          type: "connect",
          payload: config,
        });

        if (response.type === "connected") {
          setIsConnecting(false);
          // Store connection info (without password)
          setConnection({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
          });
          setState("connected");
        } else if (response.type === "error") {
          setError(response.payload.message);
          setIsConnecting(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setIsConnecting(false);
      }
    },
    [backend],
  );

  const handleDisconnect = useCallback(async () => {
    try {
      await backend.send({ type: "disconnect" });
    } catch {
      // Ignore disconnect errors
    }
    setState("connecting");
    setConnection(null);
    setError(null);
    setIsConnecting(false);
  }, [backend]);

  const handleRetry = useCallback(async () => {
    setError(null);
    try {
      await backend.start();
      setState("connecting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start backend");
      setState("error");
    }
  }, [backend]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.exit(0);
    }
    if (state === "error" && (input === "r" || input === "R")) {
      handleRetry();
    }
  });

  if (!isRawModeSupported) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="yellow">Warning: Interactive mode not supported in this environment.</Text>
        <Text color="gray">Please run in a real terminal.</Text>
      </Box>
    );
  }

  if (state === "starting") {
    return (
      <Box padding={1}>
        <Text color="blue">Starting backend...</Text>
      </Box>
    );
  }

  if (state === "error") {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="red">Error: {error || "Unknown error"}</Text>
        <Box marginTop={1}>
          <Text color="gray">Press R to retry or Ctrl+C to quit</Text>
        </Box>
      </Box>
    );
  }

  if (state === "connecting") {
    return (
      <LoginScreen
        onConnect={handleConnect}
        error={error || undefined}
        isConnecting={isConnecting}
      />
    );
  }

  // Connected state - show the new BrowseView
  if (!connection) {
    return (
      <Box padding={1}>
        <Text color="red">Error: Connection info missing</Text>
      </Box>
    );
  }

  return (
    <BrowseView
      backend={backend}
      connection={connection}
      onDisconnect={handleDisconnect}
    />
  );
};

export default App;

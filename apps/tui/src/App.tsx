import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useStdin, useInput } from "ink";
import { BackendClient } from "./hooks/useBackend.js";
import { ConnectionScreen } from "./components/ConnectionScreen.js";
import { QueryScreen } from "./components/QueryScreen.js";
import type { ConnectRequest } from "./types/index.js";

type AppState = "starting" | "connecting" | "connected" | "error";

const App: React.FC = () => {
  const { isRawModeSupported } = useStdin();
  const [backend] = useState(() => new BackendClient());
  const [state, setState] = useState<AppState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
      <ConnectionScreen
        onConnect={handleConnect}
        error={error || undefined}
        isConnecting={isConnecting}
      />
    );
  }

  return <QueryScreen backend={backend} onDisconnect={handleDisconnect} />;
};

export default App;

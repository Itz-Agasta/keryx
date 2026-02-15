import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useStdin } from "ink";
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
      setState("connecting");
      setError(null);

      try {
        const response = await backend.send({
          type: "connect",
          payload: config,
        });

        if (response.type === "connected") {
          setState("connected");
        } else if (response.type === "error") {
          setError(response.payload.message);
          setState("connecting");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setState("connecting");
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
  }, [backend]);

  if (!isRawModeSupported) {
    return (
      <Box padding={1}>
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
      <Box padding={1}>
        <Text color="red">Error: {error || "Unknown error"}</Text>
      </Box>
    );
  }

  if (state === "connecting") {
    return (
      <ConnectionScreen
        onConnect={handleConnect}
        error={error || undefined}
        isConnecting={state === "connecting"}
      />
    );
  }

  return <QueryScreen backend={backend} onDisconnect={handleDisconnect} />;
};

export default App;

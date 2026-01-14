import React, { useState, useEffect } from "react";
import Button from "../Button";
import { geminiAuth } from "../../utils/geminiAuth";

const GeminiConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [email, setEmail] = useState<string | undefined>();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    const connected = await geminiAuth.isAuthenticated();
    setIsConnected(connected);

    if (connected) {
      const tokens = await geminiAuth.getTokens();
      setEmail(tokens?.email);
    }

    setIsLoading(false);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await geminiAuth.authenticate();
      if (success) {
        setIsConnected(true);
        const tokens = await geminiAuth.getTokens();
        setEmail(tokens?.email);
      } else {
        alert("Failed to connect to Gemini. Please try again.");
      }
    } catch (error) {
      console.error("Gemini connection error:", error);
      alert("An error occurred while connecting to Gemini.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Gemini?")) {
      await geminiAuth.disconnect();
      setIsConnected(false);
      setEmail(undefined);
    }
  };

  if (isLoading) {
    return (
      <Button variant="secondary" rounded="full" disabled>
        Loading...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button
        variant="success"
        rounded="full"
        onClick={handleDisconnect}
        title={email ? `Connected as ${email}` : "Connected to Gemini"}
        className="!bg-green-500 dark:!bg-green-400 hover:!bg-green-600 dark:hover:!bg-green-500"
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          Connected{email ? ` as ${email}` : " to Gemini"}
        </span>
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      rounded="full"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? "Connecting..." : "Connect with Gemini"}
    </Button>
  );
};

export default GeminiConnect;

import React, { useState, useEffect } from "react";
import Button from "./Button";
import { jiraAuth } from "../utils/jiraAuth";

const JiraConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [siteName, setSiteName] = useState<string | undefined>();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    const connected = await jiraAuth.isAuthenticated();
    setIsConnected(connected);

    if (connected) {
      const tokens = await jiraAuth.getTokens();
      setSiteName(tokens?.siteName);
    }

    setIsLoading(false);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await jiraAuth.authenticate();
      if (success) {
        setIsConnected(true);
        const tokens = await jiraAuth.getTokens();
        setSiteName(tokens?.siteName);
      } else {
        alert("Failed to connect to Jira. Please try again.");
      }
    } catch (error) {
      console.error("Jira connection error:", error);
      alert("An error occurred while connecting to Jira.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Jira?")) {
      await jiraAuth.disconnect();
      setIsConnected(false);
      setSiteName(undefined);
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
        title={siteName ? `Connected to ${siteName}` : "Connected to Jira"}
      >
        ✓ Connected{siteName ? ` to ${siteName}` : " to Jira"}
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
      {isConnecting ? "Connecting..." : "Connect with Jira"}
    </Button>
  );
};

export default JiraConnect;

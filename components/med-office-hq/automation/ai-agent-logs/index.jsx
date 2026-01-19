"use client";

import { useEffect, useState, useRef } from "react";
// Agent logs come from a different base URL than the rest of the app services.
const AGENT_LOGS_BASE =
  "https://voice-agent-streamer.icybeach-4e9c2dde.westus2.azurecontainerapps.io";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateTimeFormat";

const AiAgentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const scrollAreaRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastTimestampRef = useRef(null);

  const fetchLogs = async (since = null) => {
    try {
      setError(null);
      const url = since
        ? `${AGENT_LOGS_BASE}/api/v1/logs?since=${since}`
        : `${AGENT_LOGS_BASE}/api/v1/logs`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch logs: ${res.status}`);
      }
      const data = await res.json();

      if (data.logs && data.logs.length > 0) {
        setLogs((prevLogs) => {
          // Combine previous logs with new logs, avoiding duplicates
          const existingTimestamps = new Set(
            prevLogs.map((log) => log.timestamp_unix)
          );
          const newLogs = data.logs.filter(
            (log) => !existingTimestamps.has(log.timestamp_unix)
          );
          return [...prevLogs, ...newLogs];
        });

        // Update last timestamp for next poll
        const latestLog = data.logs[data.logs.length - 1];
        if (latestLog.timestamp_unix) {
          setLastTimestamp(latestLog.timestamp_unix);
          lastTimestampRef.current = latestLog.timestamp_unix;
        }
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err.response?.data?.detail || "Failed to fetch logs");
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Fetch initial logs
    fetchLogs(lastTimestampRef.current);

    // Poll every 1.5 seconds - use ref to access latest timestamp
    pollingIntervalRef.current = setInterval(() => {
      fetchLogs(lastTimestampRef.current);
    }, 1500);

    setIsPolling(true);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const clearLogs = () => {
    setLogs([]);
    setLastTimestamp(null);
    lastTimestampRef.current = null;
    if (isPolling) {
      stopPolling();
      startPolling();
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const getLogLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      case "debug":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Logs</CardTitle>
              <CardDescription>
                Live logs from the voice AI agent
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={logs.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              {isPolling ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={stopPolling}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startPolling}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
          <div
            ref={scrollAreaRef}
            className="h-[calc(100vh-300px)] w-full rounded-md border p-4 overflow-y-auto"
          >
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {isPolling
                  ? "Waiting for logs..."
                  : "Click Start to begin fetching logs"}
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={`${log.timestamp_unix}-${index}`}
                    className="flex flex-col gap-1 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {log.level && (
                          <Badge variant={getLogLevelColor(log.level)}>
                            {log.level}
                          </Badge>
                        )}
                        {log.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.message && (
                      <div className="text-sm font-mono whitespace-pre-wrap break-words">
                        {log.message}
                      </div>
                    )}
                    {log.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Data
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total logs: {logs.length}</span>
            {isPolling && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                Polling...
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiAgentLogs;
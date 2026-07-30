type RecordingTimerState = "idle" | "running" | "paused" | "stopped";

export class RecordingTimer {
  private state: RecordingTimerState = "idle";
  private accumulatedMs = 0;
  private intervalStartedAt = 0;

  start(): void {
    this.accumulatedMs = 0;
    this.intervalStartedAt = performance.now();
    this.state = "running";
  }

  pause(): number {
    if (this.state === "running") {
      this.accumulatedMs += performance.now() - this.intervalStartedAt;
      this.state = "paused";
    }
    return this.elapsedMs;
  }

  resume(): void {
    if (this.state === "paused") {
      this.intervalStartedAt = performance.now();
      this.state = "running";
    }
  }

  stop(): number {
    if (this.state === "running") {
      this.accumulatedMs += performance.now() - this.intervalStartedAt;
    }
    if (this.state !== "idle") {
      this.state = "stopped";
    }
    return this.elapsedMs;
  }

  get elapsedMs(): number {
    if (this.state === "running") {
      return this.accumulatedMs + performance.now() - this.intervalStartedAt;
    }
    return this.accumulatedMs;
  }
}

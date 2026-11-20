// Weighing Scale Serial & WebSocket Service for Gold Weight Reading in Grams (g)

export interface ScaleReading {
  liveWeight: number; // in grams
  stableWeight: number; // in grams
  isStable: boolean;
  rawMessage: string;
  timestamp: number;
}

export type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type ReadingListener = (reading: ScaleReading) => void;
type StatusListener = (status: ScaleStatus, message?: string) => void;

class WeightScaleService {
  private static instance: WeightScaleService;

  private status: ScaleStatus = 'disconnected';
  private currentReading: ScaleReading = {
    liveWeight: 0,
    stableWeight: 0,
    isStable: false,
    rawMessage: '',
    timestamp: Date.now(),
  };

  private readingListeners: Set<ReadingListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  // Serial Port connection state (Web Serial API)
  private serialPort: any = null;
  private reader: any = null;
  private keepReading = false;

  // Stability detection algorithm parameters
  private buffer = '';
  private previousWeight: number | null = null;
  private stableCount = 0;
  private readonly STABLE_REQUIRED = 5;
  private readonly TOLERANCE = 0.001; // 0.001 grams tolerance

  // Local WebSocket Bridge state
  private ws: WebSocket | null = null;
  private wsReconnectTimer: any = null;
  private fallbackPorts: number[] = [8181, 8080, 8081, 8082, 8182, 8888];
  private currentPortIndex = 0;
  private customWsUrl: string | null = null;
  private activeWsUrl = 'ws://localhost:8181';

  private constructor() {
    // Attempt local WebSocket bridge auto-connect (in case local node server is running)
    this.initLocalWebSocketBridge();
  }

  public static getInstance(): WeightScaleService {
    if (!WeightScaleService.instance) {
      WeightScaleService.instance = new WeightScaleService();
    }
    return WeightScaleService.instance;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. WEB SERIAL API CONNECTION (Direct from Chrome / Edge to COM Port)
  // ─────────────────────────────────────────────────────────────────────────────

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async autoConnectPreviousSerial(baudRate = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported() || this.status === 'connected')
      return false;
    try {
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        this.serialPort = ports[0];
        await this.serialPort.open({
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none',
        });
        this.keepReading = true;
        this.updateStatus('connected', 'Scale auto-connected via Web Serial');
        this.startSerialReadLoop();
        return true;
      }
    } catch (err) {
      console.debug(
        'Auto-connect previous serial not available or failed:',
        err,
      );
    }
    return false;
  }

  public async connectSerial(baudRate = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.updateStatus(
        'error',
        'Web Serial API is not supported in this browser. Please use Chrome or Edge.',
      );
      return false;
    }

    try {
      this.updateStatus('connecting', 'Requesting COM port...');
      // Prompts user to select COM port (e.g. COM4)
      this.serialPort = await (navigator as any).serial.requestPort();

      await this.serialPort.open({
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
      });

      this.keepReading = true;
      this.updateStatus('connected', 'Scale connected via Web Serial');
      this.startSerialReadLoop();
      return true;
    } catch (err: any) {
      console.error('Serial connection error:', err);
      this.updateStatus(
        'error',
        err?.message || 'Failed to connect to Serial COM port',
      );
      return false;
    }
  }

  private async startSerialReadLoop() {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.serialPort.readable.pipeTo(
      textDecoder.writable,
    );
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.keepReading) {
        const {value, done} = await this.reader.read();
        if (done) break;
        if (value) {
          this.processRawData(value);
        }
      }
    } catch (err) {
      console.error('Error reading serial stream:', err);
      this.updateStatus('disconnected', 'Serial scale disconnected');
    } finally {
      this.reader.releaseLock();
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        // ignore
      }
      this.reader = null;
    }

    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch (e) {
        // ignore
      }
      this.serialPort = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.updateStatus('disconnected', 'Scale disconnected');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. LOCAL WEBSOCKET BRIDGE (Connects to running Node.js scale server on localhost)
  // ─────────────────────────────────────────────────────────────────────────────

  public getActiveWsUrl(): string {
    return this.activeWsUrl;
  }

  public initLocalWebSocketBridge(wsUrl?: string) {
    if (this.status === 'connected' && this.serialPort) {
      return; // Already using direct serial
    }

    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    if (wsUrl !== undefined) {
      this.customWsUrl = wsUrl.trim() ? wsUrl.trim() : null;
    }

    const targetUrl =
      this.customWsUrl ||
      `ws://localhost:${this.fallbackPorts[this.currentPortIndex]}`;

    try {
      const socket = new WebSocket(targetUrl);
      this.ws = socket;
      let connectedSuccessfully = false;

      // Timeout safety if connection hangs without triggering error/close
      const connectionTimeout = setTimeout(() => {
        if (!connectedSuccessfully && this.ws === socket) {
          try {
            socket.close();
          } catch (e) {
            // ignore
          }
          this.handleWsConnectionFailure(targetUrl);
        }
      }, 2500);

      socket.onopen = () => {
        connectedSuccessfully = true;
        clearTimeout(connectionTimeout);
        this.activeWsUrl = targetUrl;
        this.updateStatus(
          'connected',
          `Connected to scale bridge (${targetUrl})`,
        );
      };

      socket.onmessage = (event) => {
        try {
          const rawData = typeof event.data === 'string' ? event.data : '';
          const payload = JSON.parse(rawData);
          if (
            typeof payload.weight === 'number' ||
            typeof payload.liveWeight === 'number'
          ) {
            const live = payload.liveWeight ?? payload.weight;
            const stable =
              payload.stableWeight ??
              (payload.isStable ? live : this.currentReading.stableWeight);
            const isStable = Boolean(payload.isStable);

            this.updateReading({
              liveWeight: Number(live.toFixed(3)),
              stableWeight: Number(stable.toFixed(3)),
              isStable: isStable,
              rawMessage: rawData,
              timestamp: Date.now(),
            });
          } else {
            this.processRawData(rawData);
          }
        } catch (e) {
          const rawData = typeof event.data === 'string' ? event.data : '';
          this.processRawData(rawData);
        }
      };

      socket.onclose = () => {
        clearTimeout(connectionTimeout);
        if (!connectedSuccessfully) {
          this.handleWsConnectionFailure(targetUrl);
        } else {
          // Connection was established earlier and now lost
          if (!this.serialPort && this.status === 'connected') {
            this.updateStatus('disconnected', 'Scale bridge disconnected');
          }
          if (!this.serialPort) {
            this.wsReconnectTimer = setTimeout(() => {
              this.initLocalWebSocketBridge();
            }, 3000);
          }
        }
      };

      socket.onerror = () => {
        // Will trigger onclose or timeout
      };
    } catch (e) {
      this.handleWsConnectionFailure(targetUrl);
    }
  }

  private handleWsConnectionFailure(failedUrl: string) {
    if (this.serialPort) return;

    if (!this.customWsUrl) {
      // Auto-fallback: try next candidate port in list
      const nextIndex = (this.currentPortIndex + 1) % this.fallbackPorts.length;
      this.currentPortIndex = nextIndex;

      // If we finished a full cycle through all fallback ports, wait 3 seconds before next round
      const delay = nextIndex === 0 ? 3000 : 350;
      this.wsReconnectTimer = setTimeout(() => {
        this.initLocalWebSocketBridge();
      }, delay);
    } else {
      // Specific custom URL was provided, retry after 3 seconds
      this.wsReconnectTimer = setTimeout(() => {
        this.initLocalWebSocketBridge(this.customWsUrl!);
      }, 3000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SCALE DATA PARSING & 5-COUNT STABILITY ALGORITHM (Exact Node.js logic)
  // ─────────────────────────────────────────────────────────────────────────────

  public processRawData(chunk: string) {
    this.buffer += chunk;

    // Wait until carriage return line feed
    if (!this.buffer.includes('\r\n') && !this.buffer.includes('\n')) {
      return;
    }

    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || ''; // Keep incomplete TRIALing fragment

    for (const line of lines) {
      const message = line.trim();
      if (!message) continue;

      // Extract float weight from message (handles numbers like "1.745", "ST,GS,  1.745g", "+  1.745 g")
      const matches = message.match(/[-+]?\d*\.?\d+/);
      if (!matches) continue;

      const weight = parseFloat(matches[0]);
      if (Number.isNaN(weight)) continue;

      const liveGrams = Number(weight.toFixed(3));

      // Stability Check
      if (
        this.previousWeight !== null &&
        Math.abs(liveGrams - this.previousWeight) <= this.TOLERANCE
      ) {
        this.stableCount++;
      } else {
        this.stableCount = 0;
      }

      this.previousWeight = liveGrams;

      const isStableNow = this.stableCount >= this.STABLE_REQUIRED;
      let stableGrams = this.currentReading.stableWeight;

      if (isStableNow) {
        stableGrams = liveGrams;
        this.stableCount = 0; // reset
      }

      this.updateReading({
        liveWeight: liveGrams,
        stableWeight: stableGrams > 0 ? stableGrams : liveGrams,
        isStable: isStableNow,
        rawMessage: message,
        timestamp: Date.now(),
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. EVENT EMITTERS & SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  private updateReading(reading: ScaleReading) {
    this.currentReading = reading;
    console.log(
      '%c[WeightScaleService] Live Weight:',
      'color: #0284c7; font-weight: bold;',
      reading.liveWeight,
      'G | Stable:',
      reading.isStable,
      '| Raw:',
      reading.rawMessage,
    );
    this.readingListeners.forEach((listener) => {
      try {
        listener(reading);
      } catch (e) {
        console.error('Error in scale reading listener:', e);
      }
    });
  }

  private updateStatus(status: ScaleStatus, message?: string) {
    this.status = status;
    console.log(
      '%c[WeightScaleService] Status:',
      'color: #9333ea; font-weight: bold;',
      status,
      message || '',
    );
    this.statusListeners.forEach((listener) => {
      try {
        listener(status, message);
      } catch (e) {
        console.error('Error in scale status listener:', e);
      }
    });
  }

  public getReading(): ScaleReading {
    return this.currentReading;
  }

  public getStatus(): ScaleStatus {
    return this.status;
  }

  public onReading(listener: ReadingListener): () => void {
    this.readingListeners.add(listener);
    listener(this.currentReading); // Initial emit
    return () => {
      this.readingListeners.delete(listener);
    };
  }

  public onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}

export const weightScaleService = WeightScaleService.getInstance();
export default weightScaleService;

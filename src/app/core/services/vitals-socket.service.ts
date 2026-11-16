import { Injectable, OnDestroy, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { OptimizationRecommendationResponse } from '../models/vitals.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VitalsSocketService implements OnDestroy {
  private client: Client | null = null;
  private currentSubscription: StompSubscription | null = null;
  private activeSessionId: string | null = null;
  private readonly maxBufferSize = 48;

  // Real-time reactive signals
  readonly liveVerdict = signal<OptimizationRecommendationResponse | null>(null);
  readonly oscilloscopeBuffer = signal<number[]>(this.generateInitialBuffer());
  readonly isConnected = signal<boolean>(false);
  readonly connectionStatus = signal<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('DISCONNECTED');

  constructor() {
    this.initStompClient();
  }

  /**
   * Generates initial circular buffer for oscilloscope visualization
   */
  private generateInitialBuffer(): number[] {
    const initial: number[] = [];
    for (let i = 0; i < this.maxBufferSize; i++) {
      initial.push(16.6);
    }
    return initial;
  }

  /**
   * Configures STOMP client with resilient automatic reconnection
   */
  private initStompClient(): void {
    const brokerUrl = environment.wsUrl;

    this.client = new Client({
      brokerURL: brokerUrl,
      // Automatic reconnection every 4 seconds if connection drops
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg: string) => {
        if (!environment.production || msg.includes('ERROR') || msg.includes('Connected')) {
          console.debug('[VitalsSocketService]', msg);
        }
      }
    });

    this.client.onConnect = () => {
      this.isConnected.set(true);
      this.connectionStatus.set('CONNECTED');
      console.log('✅ WebSocket STOMP connected successfully to broker at /ws-vitals');

      // Re-subscribe if an active session was already registered
      if (this.activeSessionId) {
        this.performSubscription(this.activeSessionId);
      }
    };

    this.client.onDisconnect = () => {
      this.isConnected.set(false);
      this.connectionStatus.set('DISCONNECTED');
      console.warn('⚠️ WebSocket STOMP disconnected');
    };

    this.client.onStompError = (frame) => {
      this.connectionStatus.set('ERROR');
      console.error('❌ STOMP error on WebSocket broker:', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.isConnected.set(false);
      this.connectionStatus.set('DISCONNECTED');
    };

    this.connectionStatus.set('CONNECTING');
    this.client.activate();
  }

  /**
   * Dynamically subscribes to the telemetry topic for a specific session: /topic/vitals/{sessionId}
   */
  public subscribeToSession(sessionId: string): void {
    if (!sessionId) return;

    this.activeSessionId = sessionId;

    if (this.client && this.client.connected) {
      this.performSubscription(sessionId);
    }
  }

  private performSubscription(sessionId: string): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
    }

    if (!this.client || !this.client.connected) {
      return;
    }

    const destination = `/topic/vitals/${sessionId}`;
    console.log(`📡 Subscribing WebSocket channel to session topic: ${destination}`);

    this.currentSubscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const payload: OptimizationRecommendationResponse = JSON.parse(message.body);
        this.handleIncomingVerdict(payload);
      } catch (err) {
        console.error('Error parsing verdict payload from WebSocket STOMP:', err, message.body);
      }
    });
  }

  /**
   * Processes the telemetry event emitted by the backend:
   * 1. Updates liveVerdict reactive signal
   * 2. Feeds the circular oscilloscope buffer (FIFO with size limit)
   */
  private handleIncomingVerdict(verdict: OptimizationRecommendationResponse): void {
    this.liveVerdict.set(verdict);

    this.oscilloscopeBuffer.update((buffer) => {
      const nextBuffer = [...buffer];
      nextBuffer.shift();
      nextBuffer.push(verdict.predictedInpMs);
      return nextBuffer;
    });
  }

  /**
   * Applies Exponential Moving Average (EMA) smoothing to the oscilloscope buffer
   */
  public getSmoothedBuffer(alpha: number = 0.3): number[] {
    const raw = this.oscilloscopeBuffer();
    if (raw.length === 0) return [];
    const smoothed: number[] = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      smoothed.push(Number((alpha * raw[i] + (1 - alpha) * smoothed[i - 1]).toFixed(1)));
    }
    return smoothed;
  }

  /**
   * Manually disconnects the STOMP client
   */
  public disconnect(): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.isConnected.set(false);
      this.connectionStatus.set('DISCONNECTED');
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

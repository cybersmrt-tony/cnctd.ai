import { getToken } from './auth';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/api';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<(data: any) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private conversationId: string,
    private userId: string,
    private avatarId: string
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = getToken();
      const wsUrl = `${WS_BASE}/chat/${this.conversationId}/ws?userId=${this.userId}&avatarId=${this.avatarId}&token=${token}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        this.attemptReconnect();
      };
    });
  }

  sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', message }));
    }
  }

  onMessage(handler: (data: any) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(console.error);
      }, 1000 * Math.pow(2, this.reconnectAttempts));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

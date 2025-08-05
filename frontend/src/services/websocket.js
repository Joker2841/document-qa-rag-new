class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.shouldReconnect = true;
    this.messageHandlers = new Map();
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.url = null;
  }

  connect(url = null) {
    this.url = url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:8000/ws/client/${this.clientId}`;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Send ping every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        this.send({ type: 'ping' });
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
          handler(data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      clearInterval(this.pingInterval);
      
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(this.url), this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  off(type) {
    this.messageHandlers.delete(type);
  }

  getClientId() {
    return this.clientId;
  }
}

export default new WebSocketService();
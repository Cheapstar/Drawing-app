/* eslint-disable @typescript-eslint/no-explicit-any */
export class WebSocketClient {
  private socket: WebSocket;
  private handlers: Map<string, handlerFn[]> = new Map();
  private roomId: string;

  constructor(url: string, roomId: string) {
    this.socket = new WebSocket(url);
    this.roomId = roomId;
    this.connect();
  }

  connect() {
    this.socket.onopen = () => {
      console.log("Socket Connection has been Established");
    };

    this.socket.onmessage = (message) => {
      const parsedData = JSON.parse(message.data);
      const type = parsedData.type;
      const payload = parsedData.payload;

      console.log("Received Message:", parsedData);
      const handlers = this.handlers.get(type) || [];
      handlers?.forEach((handler) => handler(payload));
    };

    this.socket.onclose = () => {
      console.log("Connection has been Closed");
    };

    this.socket.onerror = (error) => {
      console.log(
        "Error has occured while connecting to the websocket server",
        error
      );
    };
  }

  on(type: string, handler: handlerFn) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    this.handlers.get(type)?.push(handler);
  }

  off(type: string, handler: handlerFn) {
    if (!this.handlers.has(type)) return;
    const handlers = this.handlers.get(type);
    const index = handlers?.indexOf(handler);
    if (index !== -1) {
      handlers?.splice(index as number, 1);
    }
  }

  send(type: string, payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type,
        payload,
      };

      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connnected");
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }

  exists = () => {
    return this.socket.readyState === WebSocket.OPEN;
  };
}

interface handlerFn {
  (payload: any): Promise<void> | void;
}

import { Response } from 'express';

interface SSEClient {
  id: string;
  jobId: string;
  res: Response;
}

class SSEService {
  private clients: SSEClient[] = [];

  addClient(id: string, jobId: string, res: Response) {
    this.clients.push({ id, jobId, res });
    reqOnClose(res, () => this.removeClient(id));
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcastToJob(jobId: string, eventName: string, data: Record<string, unknown>) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      if (client.jobId === jobId) {
        try {
          client.res.write(payload);
        } catch (err) {
          console.warn(`[SSEService] Failed writing to client ${client.id}:`, err);
        }
      }
    });
  }
}

function reqOnClose(res: Response, cb: () => void) {
  res.on('close', cb);
  res.on('finish', cb);
}

export const sseService = new SSEService();

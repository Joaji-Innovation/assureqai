/**
 * Alerts Gateway
 * WebSocket gateway for real-time alert broadcasting
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/alerts',
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AlertsGateway.name);
  private projectRooms: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up room memberships
    this.projectRooms.forEach((clients, projectId) => {
      clients.delete(client.id);
    });
  }

  /**
   * Subscribe client to project alerts
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { projectId?: string }) {
    const projectId = payload.projectId || 'global';
    const roomName = `project:${projectId}`;
    
    client.join(roomName);
    
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId)?.add(client.id);
    
    this.logger.log(`Client ${client.id} subscribed to ${roomName}`);
    return { success: true, room: roomName };
  }

  /**
   * Unsubscribe client from project alerts
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { projectId?: string }) {
    const projectId = payload.projectId || 'global';
    const roomName = `project:${projectId}`;
    
    client.leave(roomName);
    this.projectRooms.get(projectId)?.delete(client.id);
    
    this.logger.log(`Client ${client.id} unsubscribed from ${roomName}`);
    return { success: true };
  }

  /**
   * Listen for alert.created events and broadcast to subscribers
   */
  @OnEvent('alert.created')
  handleAlertCreated(payload: { alert: any; projectId?: string }) {
    const projectId = payload.projectId || 'global';
    const roomName = `project:${projectId}`;
    
    // Broadcast to project room
    this.server.to(roomName).emit('newAlert', payload.alert);
    
    // Also broadcast to global room for admin visibility
    this.server.to('project:global').emit('newAlert', payload.alert);
    
    this.logger.log(`Alert broadcasted to ${roomName}: ${payload.alert.type}`);
  }

  /**
   * Broadcast alert count update
   */
  broadcastUnreadCount(projectId: string, count: number) {
    const roomName = `project:${projectId}`;
    this.server.to(roomName).emit('unreadCount', { count });
  }
}

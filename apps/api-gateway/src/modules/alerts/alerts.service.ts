/**
 * Alerts Service
 * Manages alert creation, retrieval, and notification dispatch
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from '../../database/schemas/alert.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateAlertDto {
  type: 'FATAL_FAILURE' | 'THRESHOLD_BREACH' | 'AT_RISK_AGENT' | 'COMPLIANCE_VIOLATION' | 'LOW_SCORE';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  projectId?: string;
  auditId?: string;
  agentUserId?: string;
  agentName?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new alert and emit event for real-time notification
   */
  async createAlert(dto: CreateAlertDto): Promise<AlertDocument> {
    const alert = new this.alertModel(dto);
    const savedAlert = await alert.save();

    // Emit event for WebSocket gateway to broadcast
    this.eventEmitter.emit('alert.created', {
      alert: savedAlert.toObject(),
      projectId: dto.projectId,
    });

    this.logger.log(`Alert created: ${dto.type} - ${dto.title}`);
    return savedAlert;
  }

  /**
   * Trigger alert based on audit results
   */
  async checkAndTriggerAlerts(auditResult: any, projectId?: string): Promise<void> {
    const alerts: CreateAlertDto[] = [];

    // Check for fatal parameter failures
    const fatalFailures = auditResult.auditResults?.filter(
      (r: any) => r.type === 'Fatal' && r.score < 100
    );
    if (fatalFailures?.length > 0) {
      alerts.push({
        type: 'FATAL_FAILURE',
        severity: 'critical',
        title: 'Fatal Parameter Failure',
        message: `Agent failed ${fatalFailures.length} fatal parameter(s): ${fatalFailures.map((f: any) => f.parameterName).join(', ')}`,
        projectId,
        metadata: { fatalParameters: fatalFailures },
      });
    }

    // Check for low overall score
    if (auditResult.overallScore < 60) {
      alerts.push({
        type: 'LOW_SCORE',
        severity: 'high',
        title: 'Low Audit Score Detected',
        message: `Audit scored ${auditResult.overallScore}%, which is below the acceptable threshold.`,
        projectId,
        metadata: { score: auditResult.overallScore },
      });
    }

    // Check for compliance violations
    if (auditResult.compliance?.violations?.length > 0) {
      alerts.push({
        type: 'COMPLIANCE_VIOLATION',
        severity: auditResult.compliance.violations.some((v: any) => v.severity === 'high') ? 'critical' : 'high',
        title: 'Compliance Violation Detected',
        message: `${auditResult.compliance.violations.length} compliance violation(s) found.`,
        projectId,
        metadata: { violations: auditResult.compliance.violations },
      });
    }

    // Check for high escalation risk
    if (auditResult.sentiment?.escalationRisk === 'high') {
      alerts.push({
        type: 'AT_RISK_AGENT',
        severity: 'high',
        title: 'High Escalation Risk Detected',
        message: 'Customer showed high escalation risk during the call.',
        projectId,
        metadata: { 
          escalationRisk: auditResult.sentiment.escalationRisk,
          predictedCSAT: auditResult.sentiment.predictedCSAT,
        },
      });
    }

    // Create all triggered alerts
    for (const alertDto of alerts) {
      await this.createAlert(alertDto);
    }
  }

  /**
   * Get alerts for a project with pagination
   */
  async getAlerts(
    projectId?: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<{ data: AlertDocument[]; total: number; page: number; totalPages: number }> {
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (unreadOnly) query.isRead = false;

    const total = await this.alertModel.countDocuments(query);
    const data = await this.alertModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string): Promise<AlertDocument | null> {
    return this.alertModel.findByIdAndUpdate(
      alertId,
      { isRead: true },
      { new: true },
    );
  }

  /**
   * Mark all alerts as read for a project
   */
  async markAllAsRead(projectId?: string): Promise<void> {
    const query: any = { isRead: false };
    if (projectId) query.projectId = projectId;
    await this.alertModel.updateMany(query, { isRead: true });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(projectId?: string): Promise<number> {
    const query: any = { isRead: false };
    if (projectId) query.projectId = projectId;
    return this.alertModel.countDocuments(query);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<AlertDocument | null> {
    return this.alertModel.findByIdAndUpdate(
      alertId,
      { 
        isAcknowledged: true, 
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
      { new: true },
    );
  }
}

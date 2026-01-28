/**
 * Announcement Service - Platform announcements
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement, AnnouncementDocument } from '../../database/schemas/announcement.schema';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
  ) {}

  async create(data: Partial<Announcement>): Promise<Announcement> {
    const announcement = new this.announcementModel(data);
    return announcement.save();
  }

  async findAll(onlyActive = true): Promise<Announcement[]> {
    const query: any = {};
    if (onlyActive) {
      query.isActive = true;
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ];
    }
    return this.announcementModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Announcement> {
    const announcement = await this.announcementModel.findById(id).exec();
    if (!announcement) throw new NotFoundException(`Announcement ${id} not found`);
    return announcement;
  }

  async findForInstance(instanceId?: string): Promise<Announcement[]> {
    const now = new Date();
    return this.announcementModel.find({
      isActive: true,
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: now } }
          ]
        },
        {
          $or: [
            { audience: 'all' },
            { audience: 'specific', targetInstanceIds: instanceId }
          ]
        }
      ]
    }).sort({ createdAt: -1 }).exec();
  }

  async update(id: string, data: Partial<Announcement>): Promise<Announcement> {
    const announcement = await this.announcementModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!announcement) throw new NotFoundException(`Announcement ${id} not found`);
    return announcement;
  }

  async delete(id: string): Promise<void> {
    const result = await this.announcementModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Announcement ${id} not found`);
  }

  async deactivate(id: string): Promise<Announcement> {
    return this.update(id, { isActive: false });
  }
}

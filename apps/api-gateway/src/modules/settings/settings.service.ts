import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from '@assureqai/common';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) { }

  async getSettings(): Promise<Settings> {
    const settings = await this.settingsModel.findOne();
    if (!settings) {
      // Create default if not exists
      return this.settingsModel.create({});
    }
    return settings;
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    let settings = await this.settingsModel.findOne();
    if (!settings) {
      settings = await this.settingsModel.create(data);
    } else {
      // Handle password update separately if needed, but basic merge works here
      Object.assign(settings, data);
      await settings.save();
    }
    return settings;
  }
}

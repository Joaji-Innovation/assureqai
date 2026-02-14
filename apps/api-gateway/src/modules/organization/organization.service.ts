/**
 * Organization Service - Multi-tenant customer management
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from '../../database/schemas/organization.schema';
import {
  Instance,
  InstanceDocument,
} from '../../database/schemas/instance.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Instance.name)
    private instanceModel: Model<InstanceDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(data: any): Promise<Organization> {
    const createData = { ...data };
    if (!createData.slug) {
      createData.slug = this.generateSlug(data.name || 'org');
    }
    if (createData.instanceId && typeof createData.instanceId === 'string') {
      createData.instanceId = new Types.ObjectId(createData.instanceId);
    }

    const existing = await this.organizationModel.findOne({
      slug: createData.slug,
    });
    if (existing) {
      throw new ConflictException(
        `Organization with slug "${createData.slug}" already exists`,
      );
    }

    const org = new this.organizationModel(createData);
    const saved = await org.save();
    this.logger.log(`Created organization: ${saved.name} (${saved.slug})`);
    return saved;
  }

  async findAll(filters?: {
    status?: string;
    plan?: string;
    search?: string;
  }): Promise<Organization[]> {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.plan) query.plan = filters.plan;
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { companyName: { $regex: filters.search, $options: 'i' } },
        { contactEmail: { $regex: filters.search, $options: 'i' } },
      ];
    }
    return this.organizationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.organizationModel.findById(id).exec();
    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.organizationModel.findOne({ slug }).exec();
    if (!org) {
      throw new NotFoundException(
        `Organization with slug "${slug}" not found`,
      );
    }
    return org;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const org = await this.organizationModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
    return org;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.organizationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
    return { success: true };
  }

  async getDetails(id: string): Promise<any> {
    const org = await this.organizationModel.findById(id).lean().exec();
    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    const userCount = await this.userModel.countDocuments({
      organizationId: new Types.ObjectId(id),
    });

    let instance = null;
    if (org.instanceId) {
      instance = await this.instanceModel
        .findById(org.instanceId)
        .select('name status credits domain plan usage')
        .lean()
        .exec();
    }

    return {
      ...org,
      userCount,
      instance,
    };
  }

  async getAllWithStats(): Promise<any[]> {
    const orgs = await this.organizationModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const results = await Promise.all(
      orgs.map(async (org) => {
        const userCount = await this.userModel.countDocuments({
          organizationId: org._id,
        });

        let instance = null;
        if (org.instanceId) {
          instance = await this.instanceModel
            .findById(org.instanceId)
            .select('name status credits plan')
            .lean()
            .exec();
        }

        return {
          ...org,
          userCount,
          instance,
        };
      }),
    );

    return results;
  }

  async linkInstance(orgId: string, instanceId: string): Promise<Organization> {
    return this.update(orgId, {
      instanceId: new Types.ObjectId(instanceId) as any,
    });
  }

  async updateBranding(
    id: string,
    branding: { logo?: string; brandColor?: string },
  ): Promise<Organization> {
    return this.update(id, branding);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

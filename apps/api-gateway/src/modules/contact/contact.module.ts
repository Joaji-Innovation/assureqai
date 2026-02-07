/**
 * Contact Module - Contact form submissions
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { EmailModule } from '../email/email.module';
import { Lead, LeadSchema } from '../../database/schemas/lead.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    EmailModule
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule { }

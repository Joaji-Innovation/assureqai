/**
 * Default QA Parameter Templates
 * These templates are used when creating new projects or when clients want to start with a template
 */

export interface DefaultParameterTemplate {
  name: string;
  description: string;
  parameters: {
    id: string;
    name: string;
    weight: number;
    type: 'Fatal' | 'Non-Fatal' | 'ZTP';
    description?: string;
    subParameters?: {
      id: string;
      name: string;
      weight: number;
      description?: string;
    }[];
  }[];
}

/**
 * Standard Call Center QA Template
 * Covers common quality parameters for inbound/outbound call centers
 */
export const CALL_CENTER_TEMPLATE: DefaultParameterTemplate = {
  name: 'Standard Call Center QA',
  description: 'Comprehensive QA parameters for call center quality assessment',
  parameters: [
    {
      id: 'opening',
      name: 'Opening & Greeting',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Proper call opening and greeting protocol',
      subParameters: [
        { id: 'greeting', name: 'Professional Greeting', weight: 5, description: 'Used company-approved greeting' },
        { id: 'identification', name: 'Self Identification', weight: 5, description: 'Agent introduced themselves clearly' },
      ],
    },
    {
      id: 'verification',
      name: 'Customer Verification',
      weight: 15,
      type: 'Fatal',
      description: 'Proper customer identity verification for security',
      subParameters: [
        { id: 'security_questions', name: 'Security Questions', weight: 10, description: 'Asked required security questions' },
        { id: 'account_verification', name: 'Account Verification', weight: 5, description: 'Verified account details correctly' },
      ],
    },
    {
      id: 'active_listening',
      name: 'Active Listening',
      weight: 15,
      type: 'Non-Fatal',
      description: 'Demonstrated active listening skills',
      subParameters: [
        { id: 'understanding', name: 'Understanding Issue', weight: 8, description: 'Correctly understood customer issue' },
        { id: 'acknowledgment', name: 'Acknowledgment', weight: 7, description: 'Acknowledged customer concerns appropriately' },
      ],
    },
    {
      id: 'problem_resolution',
      name: 'Problem Resolution',
      weight: 20,
      type: 'Non-Fatal',
      description: 'Effectively resolved customer issue',
      subParameters: [
        { id: 'correct_solution', name: 'Correct Solution', weight: 10, description: 'Provided accurate and effective solution' },
        { id: 'process_knowledge', name: 'Process Knowledge', weight: 5, description: 'Demonstrated strong process knowledge' },
        { id: 'ownership', name: 'Ownership', weight: 5, description: 'Took ownership of the issue' },
      ],
    },
    {
      id: 'communication',
      name: 'Communication Skills',
      weight: 15,
      type: 'Non-Fatal',
      description: 'Clear and professional communication',
      subParameters: [
        { id: 'clarity', name: 'Clarity', weight: 5, description: 'Spoke clearly and at appropriate pace' },
        { id: 'language', name: 'Professional Language', weight: 5, description: 'Used professional and appropriate language' },
        { id: 'avoid_jargon', name: 'Avoid Jargon', weight: 5, description: 'Avoided technical jargon when speaking to customers' },
      ],
    },
    {
      id: 'empathy',
      name: 'Empathy & Courtesy',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Showed empathy and maintained courteous behavior',
      subParameters: [
        { id: 'empathy_shown', name: 'Empathy Demonstrated', weight: 5, description: 'Showed genuine understanding of customer situation' },
        { id: 'courtesy', name: 'Courteous Behavior', weight: 5, description: 'Maintained courteous tone throughout' },
      ],
    },
    {
      id: 'hold_procedure',
      name: 'Hold & Transfer',
      weight: 5,
      type: 'Non-Fatal',
      description: 'Proper hold and transfer procedures',
      subParameters: [
        { id: 'hold_permission', name: 'Hold Permission', weight: 2, description: 'Asked permission before placing on hold' },
        { id: 'hold_time', name: 'Hold Time Updates', weight: 3, description: 'Provided updates during extended holds' },
      ],
    },
    {
      id: 'closing',
      name: 'Call Closing',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Proper call closing protocol',
      subParameters: [
        { id: 'summary', name: 'Call Summary', weight: 4, description: 'Summarized actions taken and next steps' },
        { id: 'additional_help', name: 'Additional Assistance', weight: 3, description: 'Offered additional assistance' },
        { id: 'closing_script', name: 'Closing Script', weight: 3, description: 'Used proper closing script' },
      ],
    },
    {
      id: 'compliance',
      name: 'Compliance',
      weight: 0,
      type: 'ZTP',
      description: 'Zero Tolerance Policy - Critical compliance requirements',
      subParameters: [
        { id: 'data_protection', name: 'Data Protection', weight: 0, description: 'Followed data protection guidelines' },
        { id: 'no_misleading', name: 'No Misleading Info', weight: 0, description: 'Did not provide misleading information' },
        { id: 'proper_disclosure', name: 'Proper Disclosures', weight: 0, description: 'Made all required disclosures' },
      ],
    },
  ],
};

/**
 * Sales Call Template
 * Optimized for sales and conversion focused calls
 */
export const SALES_TEMPLATE: DefaultParameterTemplate = {
  name: 'Sales Call QA',
  description: 'QA parameters for sales and conversion calls',
  parameters: [
    {
      id: 'opening',
      name: 'Opening & Hook',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Engaging opening and attention hook',
      subParameters: [
        { id: 'greeting', name: 'Professional Greeting', weight: 5, description: 'Professional and warm greeting' },
        { id: 'hook', name: 'Value Hook', weight: 5, description: 'Delivered compelling value proposition early' },
      ],
    },
    {
      id: 'needs_discovery',
      name: 'Needs Discovery',
      weight: 20,
      type: 'Non-Fatal',
      description: 'Thorough discovery of customer needs',
      subParameters: [
        { id: 'open_questions', name: 'Open-ended Questions', weight: 10, description: 'Asked effective open-ended questions' },
        { id: 'active_listening', name: 'Active Listening', weight: 5, description: 'Demonstrated active listening' },
        { id: 'pain_points', name: 'Identified Pain Points', weight: 5, description: 'Identified customer pain points' },
      ],
    },
    {
      id: 'product_presentation',
      name: 'Product Presentation',
      weight: 20,
      type: 'Non-Fatal',
      description: 'Effective product/service presentation',
      subParameters: [
        { id: 'features_benefits', name: 'Features & Benefits', weight: 10, description: 'Clearly explained features and benefits' },
        { id: 'tailored', name: 'Tailored Presentation', weight: 10, description: 'Tailored presentation to customer needs' },
      ],
    },
    {
      id: 'objection_handling',
      name: 'Objection Handling',
      weight: 15,
      type: 'Non-Fatal',
      description: 'Effective handling of customer objections',
      subParameters: [
        { id: 'acknowledged', name: 'Acknowledged Objection', weight: 5, description: 'Acknowledged objection without being defensive' },
        { id: 'addressed', name: 'Addressed Effectively', weight: 10, description: 'Addressed objection effectively' },
      ],
    },
    {
      id: 'closing_attempt',
      name: 'Closing Attempt',
      weight: 20,
      type: 'Non-Fatal',
      description: 'Made appropriate closing attempt',
      subParameters: [
        { id: 'trial_close', name: 'Trial Close', weight: 5, description: 'Used trial close techniques' },
        { id: 'clear_cta', name: 'Clear Call to Action', weight: 10, description: 'Provided clear call to action' },
        { id: 'urgency', name: 'Created Urgency', weight: 5, description: 'Created appropriate sense of urgency' },
      ],
    },
    {
      id: 'compliance',
      name: 'Sales Compliance',
      weight: 15,
      type: 'Fatal',
      description: 'Sales compliance and ethical selling',
      subParameters: [
        { id: 'disclosures', name: 'Required Disclosures', weight: 8, description: 'Made all required disclosures' },
        { id: 'no_pressure', name: 'No Excessive Pressure', weight: 7, description: 'Did not use excessive pressure tactics' },
      ],
    },
  ],
};

/**
 * Technical Support Template
 * For IT helpdesk and technical support teams
 */
export const TECH_SUPPORT_TEMPLATE: DefaultParameterTemplate = {
  name: 'Technical Support QA',
  description: 'QA parameters for IT helpdesk and technical support',
  parameters: [
    {
      id: 'opening',
      name: 'Opening & Ticket Creation',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Proper opening and ticket creation',
      subParameters: [
        { id: 'greeting', name: 'Professional Greeting', weight: 5, description: 'Professional greeting' },
        { id: 'ticket', name: 'Ticket Documentation', weight: 5, description: 'Created or updated ticket properly' },
      ],
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting Process',
      weight: 30,
      type: 'Non-Fatal',
      description: 'Systematic troubleshooting approach',
      subParameters: [
        { id: 'systematic', name: 'Systematic Approach', weight: 10, description: 'Used systematic troubleshooting approach' },
        { id: 'knowledge_base', name: 'Knowledge Base Usage', weight: 10, description: 'Utilized knowledge base effectively' },
        { id: 'root_cause', name: 'Root Cause Analysis', weight: 10, description: 'Attempted to identify root cause' },
      ],
    },
    {
      id: 'technical_accuracy',
      name: 'Technical Accuracy',
      weight: 25,
      type: 'Fatal',
      description: 'Provided technically accurate information',
      subParameters: [
        { id: 'correct_info', name: 'Correct Information', weight: 15, description: 'Provided accurate technical information' },
        { id: 'proper_steps', name: 'Proper Resolution Steps', weight: 10, description: 'Followed correct resolution steps' },
      ],
    },
    {
      id: 'communication',
      name: 'Technical Communication',
      weight: 15,
      type: 'Non-Fatal',
      description: 'Clear technical communication',
      subParameters: [
        { id: 'simple_language', name: 'Simple Language', weight: 8, description: 'Explained in simple, understandable terms' },
        { id: 'guided_steps', name: 'Guided Through Steps', weight: 7, description: 'Guided customer through steps clearly' },
      ],
    },
    {
      id: 'documentation',
      name: 'Documentation',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Proper case documentation',
      subParameters: [
        { id: 'notes', name: 'Detailed Notes', weight: 5, description: 'Added detailed notes to ticket' },
        { id: 'resolution_notes', name: 'Resolution Documentation', weight: 5, description: 'Documented resolution steps' },
      ],
    },
    {
      id: 'escalation',
      name: 'Escalation Procedure',
      weight: 10,
      type: 'Non-Fatal',
      description: 'Proper escalation when needed',
      subParameters: [
        { id: 'proper_escalation', name: 'Proper Escalation', weight: 5, description: 'Escalated appropriately when needed' },
        { id: 'handoff', name: 'Proper Handoff', weight: 5, description: 'Provided proper handoff information' },
      ],
    },
  ],
};

/**
 * All available default templates
 */
export const DEFAULT_TEMPLATES: Record<string, DefaultParameterTemplate> = {
  call_center: CALL_CENTER_TEMPLATE,
  sales: SALES_TEMPLATE,
  tech_support: TECH_SUPPORT_TEMPLATE,
};

/**
 * Get all template names and descriptions for selection UI
 */
export function getTemplateOptions(): { id: string; name: string; description: string }[] {
  return Object.entries(DEFAULT_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
  }));
}

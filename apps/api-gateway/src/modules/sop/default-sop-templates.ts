/**
 * Default SOP Templates
 * These templates provide standard operating procedures for new clients
 */

export interface DefaultSOPTemplate {
  name: string;
  description: string;
  content: string; // Markdown content for the SOP
}

/**
 * Standard Call Center SOP
 */
export const CALL_CENTER_SOP: DefaultSOPTemplate = {
  name: 'Standard Call Center SOP',
  description: 'Standard operating procedures for inbound/outbound call handling',
  content: `# Standard Call Center Operating Procedures

## 1. Call Opening

### 1.1 Greeting
- Answer within 3 rings
- Use the standard greeting: "Thank you for calling [Company Name], my name is [Your Name]. How may I assist you today?"
- Speak clearly and at a moderate pace
- Maintain a warm, professional tone

### 1.2 Customer Identification
- Verify customer identity using approved security questions
- Confirm account details before discussing sensitive information
- Never bypass security procedures, even for familiar customers

---

## 2. Active Listening

### 2.1 Understanding the Issue
- Listen to the complete issue before responding
- Take notes on key details
- Avoid interrupting the customer
- Ask clarifying questions if needed

### 2.2 Acknowledgment
- Use empathetic statements: "I understand..." or "I can see how that would be frustrating..."
- Summarize the issue to confirm understanding
- Assure the customer you will help resolve their concern

---

## 3. Problem Resolution

### 3.1 Investigation
- Access relevant systems to research the issue
- Review account history and previous interactions
- Identify the root cause when possible

### 3.2 Solution
- Provide accurate information based on company policies
- Explain the solution clearly in simple terms
- Set appropriate expectations for resolution timeframes
- Offer alternatives when the first option isn't suitable

### 3.3 Documentation
- Log all interactions in the CRM system
- Include detailed notes on the issue and resolution
- Tag the call appropriately for reporting

---

## 4. Hold and Transfer Procedures

### 4.1 Hold Process
- Ask permission: "May I place you on a brief hold while I research this?"
- Thank the customer when returning from hold
- Update customer every 60-90 seconds on extended holds
- Offer callback option for holds exceeding 3 minutes

### 4.2 Transfer Process
- Explain why a transfer is necessary
- Provide the name/department being transferred to
- Warm transfer whenever possible (stay on line to introduce)
- Never blind transfer without asking permission

---

## 5. Call Closing

### 5.1 Resolution Confirmation
- Summarize actions taken and next steps
- Confirm the customer's issue has been addressed
- Provide any relevant reference numbers

### 5.2 Additional Assistance
- Ask: "Is there anything else I can assist you with today?"
- Thank the customer for their patience/call
- Use appropriate closing: "Thank you for choosing [Company Name]. Have a great day!"

---

## 6. Compliance Requirements

### 6.1 Data Protection
- Never share customer information with unauthorized parties
- Use secure channels for sensitive data
- Follow PII handling procedures

### 6.2 Required Disclosures
- Read required disclaimers when applicable
- Inform customers of recording when required
- Provide terms and conditions as needed

---

## 7. Escalation Procedures

### 7.1 When to Escalate
- Customer requests a supervisor
- Issue exceeds your authority level
- Technical issues requiring specialist support
- Complaints requiring management attention

### 7.2 Escalation Process
- Document the issue thoroughly before escalating
- Provide warm handoff with full context
- Follow up to ensure resolution when possible
`,
};

/**
 * Sales Call SOP
 */
export const SALES_SOP: DefaultSOPTemplate = {
  name: 'Sales Call SOP',
  description: 'Standard operating procedures for sales and conversion calls',
  content: `# Sales Call Operating Procedures

## 1. Opening & Engagement

### 1.1 Initial Contact
- Introduce yourself confidently and professionally
- State the purpose of your call clearly
- Hook the prospect with a compelling value statement
- Build rapport quickly through personalization

### 1.2 Permission-Based Selling
- Confirm you're speaking with the decision-maker
- Ask permission to continue: "Do you have a few minutes to discuss...?"
- Respect "no" while creating curiosity for future contact

---

## 2. Needs Discovery

### 2.1 Questioning Techniques
- Use open-ended questions to understand needs
- Listen more than you speak (70/30 rule)
- Identify pain points and challenges
- Uncover the prospect's decision-making process

### 2.2 Key Discovery Questions
- "What challenges are you currently facing with...?"
- "What would an ideal solution look like for you?"
- "What's your timeline for making a decision?"
- "Who else is involved in this decision?"

---

## 3. Product Presentation

### 3.1 Tailored Solutions
- Connect features to the prospect's specific needs
- Focus on benefits, not just features
- Use success stories and case studies
- Address the prospect's pain points directly

### 3.2 Value Proposition
- Clearly articulate ROI and value
- Differentiate from competitors
- Use specific numbers and results when possible

---

## 4. Objection Handling

### 4.1 LARC Method
- **L**isten: Hear the full objection
- **A**cknowledge: Show understanding
- **R**espond: Address the concern
- **C**onfirm: Ensure satisfaction with answer

### 4.2 Common Objections
- Price: Focus on value and ROI
- Timing: Create urgency, offer flexibility
- Competition: Differentiate with unique benefits
- Authority: Offer resources for decision-makers

---

## 5. Closing Techniques

### 5.1 Trial Close
- Check buying signals throughout the call
- Use assumptive language when appropriate
- Test readiness: "How does this sound so far?"

### 5.2 Closing the Sale
- Summarize the value and benefits
- Present clear call-to-action
- Offer limited-time incentives when available
- Confirm next steps and timeline

---

## 6. Compliance & Ethics

### 6.1 Ethical Selling
- Never make false or misleading claims
- Provide accurate product information
- Respect customer's decision to decline
- Follow do-not-call lists and regulations

### 6.2 Required Disclosures
- Read all required disclaimers
- Explain terms and conditions clearly
- Document customer consent properly

---

## 7. Follow-Up Procedures

### 7.1 Post-Call Actions
- Send confirmation email within 24 hours
- Schedule follow-up for undecided prospects
- Update CRM with call details and next steps
- Submit orders/paperwork promptly
`,
};

/**
 * Technical Support SOP
 */
export const TECH_SUPPORT_SOP: DefaultSOPTemplate = {
  name: 'Technical Support SOP',
  description: 'Standard operating procedures for IT helpdesk and technical support',
  content: `# Technical Support Operating Procedures

## 1. Initial Contact & Ticket Creation

### 1.1 Call Opening
- Greet professionally and identify yourself
- Obtain customer identification and account info
- Create or locate existing ticket immediately
- Document system/environment details

### 1.2 Issue Categorization
- Identify the type of issue (hardware, software, network, etc.)
- Determine severity and priority level
- Check for known issues or outages
- Set appropriate expectations for resolution

---

## 2. Troubleshooting Process

### 2.1 Information Gathering
- Ask when the issue started
- Determine what changed recently
- Identify error messages or symptoms
- Check if issue is reproducible

### 2.2 Systematic Troubleshooting
- Start with simple solutions first
- Follow the knowledge base articles
- Document each step attempted
- Use remote access tools when appropriate

### 2.3 Common First Steps
1. Verify connectivity (network, power)
2. Clear cache and cookies (for web issues)
3. Restart application or device
4. Check for updates or patches
5. Verify user permissions and access

---

## 3. Technical Communication

### 3.1 Customer Guidance
- Use clear, simple language (avoid jargon)
- Guide step-by-step through actions
- Confirm each step before proceeding
- Be patient with non-technical users

### 3.2 Setting Expectations
- Provide realistic time estimates
- Explain what you're doing and why
- Inform of any data loss risks before actions
- Confirm understanding before ending call

---

## 4. Documentation Requirements

### 4.1 Ticket Updates
- Record all troubleshooting steps taken
- Note system information and error messages
- Document customer communication
- Update status and priority as needed

### 4.2 Resolution Documentation
- Record the root cause if identified
- Document the solution implemented
- Note any workarounds provided
- Add knowledge base article if applicable

---

## 5. Escalation Procedures

### 5.1 When to Escalate
- Issue exceeds your technical capability
- Problem requires specialist or vendor support
- Customer requests escalation
- Issue affects multiple users/systems

### 5.2 Escalation Process
- Document all troubleshooting already attempted
- Include system logs and error details
- Provide customer contact information
- Set expectations with customer about escalation

---

## 6. Remote Support Guidelines

### 6.1 Remote Access Procedures
- Obtain explicit permission before connecting
- Explain what you'll be doing on their system
- Stay on the call during remote session
- Disconnect and confirm when done

### 6.2 Security Considerations
- Never ask for or store passwords
- Use approved remote tools only
- Maintain customer privacy during sessions
- Log all remote access for audit trail

---

## 7. Follow-Up & Quality

### 7.1 Issue Resolution
- Confirm issue is fully resolved with customer
- Explain how to prevent future occurrences
- Provide ticket number for reference
- Offer additional assistance

### 7.2 Pending Issues
- Schedule follow-up for unresolved issues
- Send status updates as promised
- Close loop on all open tickets
- Ensure customer satisfaction before closing
`,
};

/**
 * All available SOP templates
 */
export const DEFAULT_SOP_TEMPLATES: Record<string, DefaultSOPTemplate> = {
  call_center: CALL_CENTER_SOP,
  sales: SALES_SOP,
  tech_support: TECH_SUPPORT_SOP,
};

/**
 * Get all SOP template options for selection UI
 */
export function getSOPTemplateOptions(): { id: string; name: string; description: string }[] {
  return Object.entries(DEFAULT_SOP_TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
  }));
}

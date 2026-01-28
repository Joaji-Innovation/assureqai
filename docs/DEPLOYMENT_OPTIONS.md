# AI Model Deployment Options

This document outlines the deployment options available for the AI/LLM components of the AssureQAI platform.

---

## Current Implementation: Google Gemini API

We are currently using the **Gemini 2.5 Flash** model via Google's Generative Language API for call auditing and analysis.

### How We Use It

| Feature            | Description                                    |
| ------------------ | ---------------------------------------------- |
| **Model**          | Gemini 2.5 Flash                               |
| **API Endpoint**   | Google Generative Language API (REST)          |
| **Primary Use**    | Call transcript auditing and quality scoring   |
| **Secondary Uses** | Chat-based QA assistance, concept explanations |

### Capabilities in AssureQAI

- **Call Auditing**: Analyzes transcripts against configurable QA parameters (Fatal, Non-Fatal, ZTP)
- **Sentiment Analysis**: Evaluates both customer and agent sentiment, predicts CSAT scores
- **Coaching Insights**: Identifies agent strengths, areas for improvement, and suggested actions
- **Compliance Detection**: Scans for compliance violations and required keywords
- **Evidence Citations**: Provides transcript quotes supporting each score
- **Confidence Scoring**: Reports confidence levels for each assessment

### Configuration

| Setting           | Value                                 |
| ----------------- | ------------------------------------- |
| Temperature       | 0.1 (deterministic responses)         |
| Max Output Tokens | 4,096                                 |
| Rate Limits       | 10 requests/minute, 500 requests/hour |
| Retry Logic       | 3 attempts with exponential backoff   |

### Current Limitations

- Requires internet connectivity at all times
- Data is sent to Google's servers for processing
- Per-request pricing can scale up with high volumes
- API key must be kept secure and rotated periodically

---

## Option 1: Self-Hosted (Our Server)

Deploy the AI model on our own infrastructure.

### Advantages

- **Full Control**: Complete ownership over infrastructure, data, and model updates
- **Data Privacy**: All data stays within our network—ideal for sensitive compliance requirements
- **Cost Predictability**: Fixed infrastructure costs without per-request billing
- **Customization**: Freedom to fine-tune models, optimize hardware, and configure as needed
- **No Vendor Lock-in**: Independence from third-party service availability

### Disadvantages

- **High Initial Investment**: Requires purchasing or leasing GPU servers (NVIDIA A100, H100, etc.)
- **Maintenance Overhead**: Team needs expertise in MLOps, model serving, and infrastructure management
- **Scaling Complexity**: Manual scaling during traffic spikes; need to provision for peak capacity
- **Operational Responsibility**: Uptime, security patches, and backups are fully our responsibility

### Technical Requirements

| Component     | Minimum Recommendation                           |
| ------------- | ------------------------------------------------ |
| GPU           | NVIDIA A100 (40GB/80GB) or H100                  |
| RAM           | 64GB or higher                                   |
| Storage       | NVMe SSD, 1TB or more                            |
| Framework     | vLLM, Text Generation Inference (TGI), or Triton |
| Orchestration | Kubernetes with GPU operators                    |

### Estimated Costs

- **Hardware Purchase**: $15,000–$40,000 per GPU server (one-time)
- **Cloud GPU Instances**: $2–$8 per hour (AWS p4d, GCP a2-highgpu)
- **Operational**: DevOps/MLOps engineer time for maintenance

---

## Option 2: Client-Hosted (Client's Server)

Deploy the AI model on the client's own infrastructure.

### Advantages

- **Data Sovereignty**: Client's data never leaves their premises—critical for regulated industries (healthcare, finance, government)
- **Compliance Ready**: Easier to meet strict requirements like HIPAA, GDPR, and SOC2
- **Client Trust**: Builds confidence as clients control their own data
- **Reduced Liability**: Data breach responsibility shifts to client infrastructure

### Disadvantages

- **Variable Infrastructure**: Client hardware may vary; need to support multiple configurations
- **Limited Access**: Debugging and maintenance require client cooperation
- **Update Complexity**: Rolling out model updates across multiple client environments
- **Support Burden**: Need to provide installation guides, documentation, and technical support

### Deployment Models

| Model                  | Best For                                            |
| ---------------------- | --------------------------------------------------- |
| Docker Containers      | Portable, consistent deployment across environments |
| Kubernetes Helm Charts | Clients with existing K8s infrastructure            |
| Pre-built VM Images    | Quick setup for clients without container expertise |
| Physical Appliance     | Air-gapped or high-security environments            |

### Minimum Client Requirements

| Component | Specification                       |
| --------- | ----------------------------------- |
| CPU       | 16+ cores                           |
| RAM       | 64GB or higher                      |
| GPU       | NVIDIA T4 or better (for inference) |
| Storage   | 500GB SSD                           |
| OS        | Ubuntu 22.04 LTS or RHEL 8+         |

---

## Option 3: Google Vertex AI (Managed Cloud)

Use Google Cloud's enterprise AI platform for fully managed deployment.

### Advantages

- **Fully Managed**: Google handles infrastructure, scaling, and availability
- **Enterprise-Grade**: Built-in security, monitoring, and compliance certifications
- **Auto-Scaling**: Automatically scales based on traffic—pay only for what you use
- **Native Integration**: Works seamlessly with GCP services (BigQuery, Cloud Storage, Pub/Sub)
- **Model Garden**: Access to pre-trained models and easy fine-tuning capabilities
- **Low Latency**: Global endpoints with Google's edge network

### Disadvantages

- **Cost at Scale**: Can become expensive with high request volumes
- **Vendor Lock-in**: Tied to Google Cloud ecosystem
- **Less Control**: Limited customization compared to self-hosted
- **Data Residency**: Data processed on Google's infrastructure (may not suit all compliance needs)

### Available Services

| Service                 | Description                               | Best For                            |
| ----------------------- | ----------------------------------------- | ----------------------------------- |
| Vertex AI Prediction    | Deploy custom models on managed endpoints | Fine-tuned proprietary models       |
| Vertex AI Generative AI | Access Gemini and other foundation models | General LLM tasks, quick deployment |
| Model Garden            | Browse and deploy pre-trained models      | Rapid prototyping, benchmarking     |

### Pricing Model

- **Prediction Endpoints**: Based on node hours and machine type selected
- **Generative AI (Gemini)**: Per 1,000 characters for input and output

### Migration Path from Current Setup

Migrating from the Gemini API to Vertex AI is straightforward since both use the same underlying models. The main changes involve switching to the Vertex AI SDK and configuring GCP project authentication instead of API keys.

---

## Option 4: Open Source Models (Qwen, Llama, Mistral)

Deploy open-source LLMs for full flexibility and control.

### Popular Model Options

| Model     | Sizes Available   | Strengths                                                   |
| --------- | ----------------- | ----------------------------------------------------------- |
| Qwen 2.5  | 7B, 14B, 32B, 72B | Excellent multilingual support, strong reasoning            |
| Llama 3.1 | 8B, 70B, 405B     | General purpose, massive community, extensive documentation |
| Mistral   | 7B, 8x7B, 8x22B   | Highly efficient, excellent for code-related tasks          |
| DeepSeek  | 7B, 33B, 67B      | Strong reasoning capabilities, cost-effective               |

### Advantages

- **No Licensing Fees**: Free to use and modify (verify specific license terms)
- **Full Customization**: Fine-tune on domain-specific call center data
- **Transparency**: Full visibility into model behavior and decisions
- **Community Support**: Active development, frequent improvements, open discussions
- **Offline Capable**: Can run completely air-gapped if needed

### Disadvantages

- **Infrastructure Required**: Still need to self-host (see Option 1 requirements)
- **Expertise Needed**: Requires ML engineering knowledge for deployment and optimization
- **Performance Gap**: May not match proprietary models (GPT-4, Claude, Gemini) on complex tasks
- **Fine-Tuning Investment**: Training on custom data requires significant compute resources

### Model Sizes for Call Auditing

| Use Case        | Recommended Model              | Why                                           |
| --------------- | ------------------------------ | --------------------------------------------- |
| Cost-Sensitive  | Qwen 2.5 7B or Llama 3.1 8B    | Good quality at minimal hardware cost         |
| Balanced        | Qwen 2.5 32B or Llama 3.1 70B  | Strong performance, reasonable resource needs |
| Maximum Quality | Qwen 2.5 72B or Llama 3.1 405B | Closest to proprietary model quality          |

### Serving Options

| Framework                       | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| vLLM                            | High-throughput serving with PagedAttention optimization   |
| Text Generation Inference (TGI) | Hugging Face's production-ready inference server           |
| Ollama                          | Simple local deployment, great for development and testing |
| llama.cpp                       | CPU-optimized inference for environments without GPUs      |

---

## Comparison Matrix

| Criteria            | Gemini API (Current) | Our Server | Client Server | Vertex AI  | Open Source |
| ------------------- | -------------------- | ---------- | ------------- | ---------- | ----------- |
| **Initial Cost**    | None                 | High       | Low           | None       | Medium      |
| **Running Cost**    | Variable             | Medium     | Low           | Variable   | Medium      |
| **Data Privacy**    | ⭐⭐⭐               | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐  |
| **Scalability**     | ⭐⭐⭐⭐             | ⭐⭐⭐     | ⭐⭐          | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      |
| **Maintenance**     | None                 | High       | Low           | None       | High        |
| **Control**         | ⭐⭐                 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐        | ⭐⭐       | ⭐⭐⭐⭐⭐  |
| **Time to Deploy**  | Already Live         | Weeks      | Days          | Hours      | Days        |
| **Model Quality**   | ⭐⭐⭐⭐⭐           | Depends    | Depends       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐    |
| **Offline Support** | ❌                   | ✅         | ✅            | ❌         | ✅          |

---

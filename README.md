# SIH 2025 - LokVaani 🏛️✨
**AI-Powered Public Consultation Intelligence for India**

<p align="center">
  <img src="https://img.shields.io/badge/Domain-GovTech-blue.svg" alt="Domain" />
  <img src="https://img.shields.io/badge/AI-NLP%20%7C%20LLM-purple.svg" alt="AI" />
  <img src="https://img.shields.io/badge/Real--Time-Socket.IO-green.svg" alt="Realtime" />
  <img src="https://img.shields.io/badge/Built%20for-MoCA-orange.svg" alt="MoCA" />
  <img src="https://img.shields.io/badge/Hackathon-SIH-red.svg" alt="SIH" />
</p>

<p align="center">
  <img width="2844" height="1132" alt="a1" src="https://github.com/user-attachments/assets/e951ad58-f25f-4f14-9371-8121f51b0786" />
</p>

## 🌟 Overview

**LokVaani** is an end-to-end AI platform that helps policy teams analyze large volumes of stakeholder feedback with speed, transparency, and precision.

It is designed for the Ministry of Corporate Affairs (MoCA) consultation workflow, where thousands of comments must be reviewed across multiple languages and formats.

Instead of slow manual review, LokVaani provides:
- Clause-linked insight extraction.
- Sentiment and category intelligence.
- Real-time dashboard visibility for officials.
- Explainable prioritization for high-impact feedback.

## 🎯 Problem Statement

Public consultation feedback is often:
- Scattered across text and documents.
- Written in English, Hindi, and Hinglish.
- Difficult to map to exact legislative clauses.
- Time-consuming to manually assess at scale.

This creates delayed policy decisions, inconsistent interpretation, and missed high-risk signals.

## 💡 Solution

LokVaani delivers a complete intelligence stack for consultation analysis:

- **AI-Powered Governance Pipeline**: Automates comment ingestion, analysis, and storage.
- **Clause-Level Stance Mapping**: Connects comments to clause identifiers (for example, `Section 5`) to detect concern hotspots.
- **Multilingual + Code-Mixed Support**: Handles English, Hindi, and Hinglish processing.
- **Real-Time Analytics**: Live updates with Socket.IO for sentiment and trend monitoring.
- **Explainable Prioritization**: High-impact inbox and keyword evidence to accelerate review workflows.

## 🚀 Key Features

### 🔍 Smart Analysis
- Clause-wise sentiment analytics.
- Category-level and overall summary snapshots.
- Weighted sentiment computation for balanced scoring.
- Top negative/high-impact comment surfacing.
<img width="2850" height="1572" alt="a4" src="https://github.com/user-attachments/assets/f99c8f95-9356-44b2-82ac-e4d229abdb8e" />
-
<img width="2832" height="1584" alt="a5" src="https://github.com/user-attachments/assets/9bc7bed8-4131-45f5-a97c-505c449f57d7" />

### ⚡ Real-Time Monitoring
- Live dashboard streams via Socket.IO.
- Auto-updated sentiment counters and trend views.
- Real-time visibility for policy and admin teams.
<img width="2842" height="1572" alt="a6" src="https://github.com/user-attachments/assets/62e918ea-aa36-4144-805b-f482e08dccda" />
-
<img width="2730" height="1298" alt="a7" src="https://github.com/user-attachments/assets/4dff2aac-e4e4-4ff9-98f9-09150879f64c" />
-
<img width="2840" height="1588" alt="a8" src="https://github.com/user-attachments/assets/7f1be469-8850-4dd9-8312-b19f9418bcf0" />

### 🌐 Multilingual Intelligence
- Hindi to English translation in AI pipeline.
- Processing support for code-mixed text.
- Language-aware comment workflows for broader inclusion.
    <img width="2426" height="1558" alt="a3" src="https://github.com/user-attachments/assets/9aee3814-2326-4f1c-a619-8d719c558c60" />


### 🤖 AI Assistant
- Draft-aware conversational assistant endpoint.
- Context-grounded Q&A using draft chunks + comment intelligence.
- <img width="1414" height="386" alt="a33" src="https://github.com/user-attachments/assets/de62ce44-a1e6-488a-823a-8ebee0d9168e" />

### 📊 Reporting & Exports
- CSV exports for analyzed comments.
- Word cloud generation for thematic visualization.

## 🏗️ System Architecture

```text
Frontend (React + Vite + TypeScript)
        |
        v
Backend API (Node.js + Express + Prisma)
        |
        +--> PostgreSQL (Neon)
        +--> Inngest Workflows
        +--> AI Modules (Python microservices)
              - module1: Contextual comment generation
              - module2: Translation + sentiment + legal summarization
              - module3: Category/overall summary generation
              - module4: Word cloud generation
```

## 🧩 Repository Structure

```text
LokVaani/
├── frontend/       # React + TypeScript client
├── backend/        # Express + Prisma + Socket.IO services
└── ai_modules/     # Python AI modules (module1..module4)
```

Note: Active AI directory is `ai_modules/`.

## 🛠️ Tech Stack

### Top 10 Stack Names
1. Node.js
2. TypeScript
3. Express.js
4. PostgreSQL (Neon)
5. Prisma ORM
6. Socket.IO
7. Inngest
8. FastAPI
9. Flask
10. Google Vertex AI (Gemini)

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | Type-safe SPA UI |
| Vite | Fast development and build tooling |
| Redux Toolkit | State management |
| React Router | Client-side routing |
| MUI + Recharts + Framer Motion | Data-rich, interactive UI components |
| Socket.IO Client | Real-time dashboard updates |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript + Express 5 | API layer and service orchestration |
| Prisma ORM | Database access and schema management |
| PostgreSQL (Neon) | Primary data store |
| JWT + bcrypt + CORS | Authentication and security controls |
| Multer + PDF utilities | File/document handling |
| Inngest | Event-driven background workflows |
| Socket.IO | Real-time transport for analytics events |

### AI Modules
| Technology | Purpose |
|---|---|
| FastAPI (`module1`) + Flask (`module2-4`) | AI microservice APIs |
| Vertex AI + Gemini | LLM reasoning and generation |
| LangChain | Prompt/pipeline orchestration |
| Hugging Face Transformers + PyTorch | Sentiment and NLP components |
| Ollama (`mistral:7b-instruct`) | Local/secondary summarization path |
| Argos Translate | Hindi to English translation |
| scikit-learn + pandas + numpy | Clustering and analytics |
| NLTK + spaCy | NLP enrichment |
| PyMuPDF, docx2txt, pdf2image, GCV | Document extraction and OCR support |
| WordCloud | Visual topic summarization |

## 🧠 Innovation & Uniqueness

1. **Clause-Linked Policy Intelligence** instead of only generic sentiment.
2. **Governance-first explainability** with keyword and priority evidence.
3. **Hybrid AI architecture** combining backend workflows + specialized Python modules.
4. **Multilingual consultation readiness** for Indian language realities.
5. **Live monitoring capability** through event-driven real-time updates.

## 📈 Impact (Project Outcomes)

- Faster review cycles through automated classification and summarization.
- Better visibility into contested clauses via clause-wise sentiment maps.
- Reduced manual load using prioritized/high-impact comment routing.
- Improved accessibility for non-English and code-mixed submissions.
- Stronger decision support for officials through dashboard-first insights.

## 🔌 API Surface

Base backend routes:
- `/api/v1/users`
- `/api/v1/posts`
- `/api/v1/comments`
- `/api/v1/companies`
- `/api/v1/admin`
- `/api/v1/agent`
- `/api/v1/summaries`
- `/api/v1/inngest`

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- npm
- Python 3.10+
- PostgreSQL/Neon database

### 1. Clone

```bash
git clone https://github.com/EKTA-056/Lok-Vaani.git
cd Lok-Vaani
```

### 2. Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

Build verification:

```bash
npm run build
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 4. AI Modules (run required services)

```bash
cd ../ai_modules/module1 && pip install -r requirements.txt && python app.py
cd ../module2 && pip install -r requirements.txt && python app.py
cd ../module3 && pip install -r requirements.txt && python app.py
cd ../module4 && pip install -r requirements.txt && python app.py
```

Each AI module also includes a Dockerfile for containerized deployment.

## ⚙️ Environment Variables (High-Level)

Backend commonly uses:
- `DATABASE_URL`
- `PORT`
- `FRONTEND_URL`
- `JWT_SECRET`
- `MODEL1_API_URL`, `MODEL2_API_URL`, `MODULE3_API_URL`, `IMAGE_API_URL`

AI modules commonly use:
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `VERTEX_AI_CREDENTIALS` or `GOOGLE_APPLICATION_CREDENTIALS`
- Module-specific upstream API values

## 🖼️ Screenshots

### Admin Dashboard
<img width="2844" height="1596" alt="a9" src="https://github.com/user-attachments/assets/69c6e66f-45bf-4072-bddc-e6b0505311c2" />

### Pricing
 <img width="2836" height="1434" alt="a10" src="https://github.com/user-attachments/assets/774c85eb-0ce9-426c-b185-5a03bc4b4663" />

## 🤝 Team

Built as a Smart India Hackathon project focused on scalable, explainable, and inclusive public-policy consultation intelligence.

Built as a Smart India Hackathon project focused on scalable, explainable, and inclusive public-policy consultation intelligence.

## 🔭 Projects Link: [LokVaani](https://lokvaani.vikashkr.online/)

## 🔭 Projects Link: [LokVaani](https://lokvaani.vikashkr.online/)



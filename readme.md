# 📚 DocuMind AI - Intelligent Document Q&A System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-green.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)

**Transform your documents into an intelligent knowledge base with AI-powered search and Q&A**

</div>

---

## 🎯 Overview

**DocuMind AI** is a production-ready **Retrieval-Augmented Generation (RAG)** system that enables intelligent question-answering over your documents. Upload PDFs, Word docs, or text files, and instantly query them using natural language with AI-powered responses backed by actual document sources.

### ✨ Key Highlights

- **🚀 GPU-Accelerated Processing** - FAISS vector search with CUDA support
- **🤖 Multiple LLM Support** - Groq, OpenAI, Anthropic, and local models
- **⚡ Real-time Streaming** - WebSocket-based answer streaming
- **📊 Analytics Dashboard** - Track usage, popular queries, and performance
- **🔐 Production-Ready** - Secure configuration, rate limiting, and monitoring
- **📱 Progressive Web App** - Installable, offline-capable frontend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Upload  │ │   Chat   │ │Documents │ │  Analytics   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /documents  /query  /analytics  /ws  /system        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  RAG Pipeline                         │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │  │
│  │ │Document  │→│ Chunking │→│Embedding │→│  FAISS  │ │  │
│  │ │Processor │ │ Service  │ │ Service  │ │  Store  │ │  │
│  │ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │  │
│  │                     ↓                                 │  │
│  │              ┌──────────────┐                        │  │
│  │              │ LLM Service  │                        │  │
│  │              │ (Multi-Model)│                        │  │
│  │              └──────────────┘                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────▼──────────┐
         │     PostgreSQL        │
         │  ┌─────────────────┐  │
         │  │ Documents Table │  │
         │  │ Analytics Table │  │
         │  │  Query History  │  │
         │  └─────────────────┘  │
         └───────────────────────┘
```

## 🚀 Features

### Document Management
- **Multi-format Support**: PDF, DOCX, TXT, HTML, Markdown
- **Batch Upload**: Process multiple documents simultaneously  
- **Smart Text Extraction**: Handles complex layouts, tables, and images
- **Progress Tracking**: Real-time upload and processing status via WebSocket

### Intelligent Search & Q&A
- **Semantic Search**: Find relevant information using natural language
- **Context-Aware Answers**: AI generates responses based on your documents
- **Source Attribution**: Every answer includes document sources with relevance scores
- **Conversation Memory**: Maintains context across multiple questions

### Advanced RAG Pipeline
- **Intelligent Chunking**: 1000-character chunks with 200-character overlap
- **High-Quality Embeddings**: 
  - Development: BGE-large-en-v1.5 (1024 dimensions)
  - Production: all-MiniLM-L6-v2 (384 dimensions)
- **FAISS Vector Store**: GPU-accelerated similarity search
- **Multi-LLM Support**: Automatic fallback between providers

### Analytics & Monitoring
- **Usage Statistics**: Track queries, response times, and success rates
- **Popular Questions**: Identify frequently asked questions
- **Query Trends**: Visualize usage patterns over time
- **Performance Metrics**: Monitor embedding and LLM performance

### Production Features
- **Rate Limiting**: Configurable per-endpoint limits
- **CORS Configuration**: Environment-specific origins
- **Health Checks**: Comprehensive system status endpoints
- **Error Tracking**: Sentry integration ready
- **Secure Configuration**: No hardcoded secrets, validation on startup

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Vector Store**: FAISS (CPU/GPU)
- **ML/AI**:
  - PyTorch 2.1.0
  - Sentence Transformers 2.2.2
  - Transformers 4.35.0
  - LangChain 0.0.340
- **Document Processing**: 
  - PDFPlumber
  - python-docx
  - BeautifulSoup4
- **Real-time**: WebSockets
- **Deployment**: Docker, Railway/Render ready

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **HTTP Client**: Axios
- **UI Components**: Custom glass-morphism design
- **PWA**: Service workers, offline support

### AI Models & Services
- **Embedding Models**:
  - BAAI/bge-large-en-v1.5
  - sentence-transformers/all-MiniLM-L6-v2
- **LLM Providers**:
  - Groq (Llama, Mixtral)
  - OpenAI (GPT-3.5/4)
  - Anthropic (Claude)
  - Local models via Llama.cpp

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- CUDA 11.8+ (optional, for GPU acceleration)
- 8GB+ RAM recommended

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/documind.git
cd documind
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
python -c "from app.database import init_db; init_db()"

# Run the backend
python run.py
```

Backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

### Individual Containers

```bash
# Backend
cd backend
docker build -t documind-backend .
docker run -p 8000:8000 --env-file .env documind-backend

# Frontend
cd frontend
docker build -t documind-frontend .
docker run -p 80:80 documind-frontend
```

## ☁️ Cloud Deployment

### Railway

1. **Backend Deployment**:
```bash
# In backend directory
railway login
railway link
railway up
```

2. **Set Environment Variables**:
```bash
railway variables set SECRET_KEY=<your-secret>
railway variables set DATABASE_URL=<auto-provided>
railway variables set GROQ_API_KEY=<your-key>
```

3. **Frontend Deployment**:
```bash
# In frontend directory
railway link
railway variables set VITE_API_URL=<backend-url>
railway up
```

### Environment Variables

#### Backend (.env)
```env
# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret

# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# LLM Providers (at least one required)
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...

# Features
ENABLE_GPU=false
ENABLE_STREAMING=true
RATE_LIMIT_ENABLED=true

# CORS (production)
CORS_ORIGINS=https://your-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 📖 API Documentation

### Core Endpoints

#### Document Management
```http
POST   /api/v1/documents/upload          # Upload document
GET    /api/v1/documents/                # List documents
GET    /api/v1/documents/{id}            # Get document
DELETE /api/v1/documents/{id}            # Delete document
POST   /api/v1/documents/search          # Semantic search
```

#### Query & Chat
```http
POST   /api/v1/query/ask                 # Ask question
GET    /api/v1/query/history             # Get query history
POST   /api/v1/query/search              # Search documents
```

#### Analytics
```http
GET    /api/v1/analytics/stats           # Usage statistics
GET    /api/v1/analytics/popular-questions  # Popular queries
GET    /api/v1/analytics/query-trends    # Query trends
```

#### WebSocket
```ws
WS     /ws/client/{client_id}            # Real-time updates
```

### Example: Ask a Question

```python
import requests

# Upload a document
with open("document.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/v1/documents/upload",
        files={"file": f}
    )
doc_id = response.json()["id"]

# Ask a question
response = requests.post(
    "http://localhost:8000/api/v1/query/ask",
    json={
        "question": "What are the main findings?",
        "document_ids": [doc_id],
        "top_k": 5
    }
)

print(response.json()["answer"])
```

## 🎮 Usage Guide

### 1. Upload Documents
- Navigate to Upload tab
- Drag & drop or select files
- Supported: PDF, Word, Text, HTML, Markdown
- Max size: 20MB per file

### 2. Ask Questions
- Go to Chat tab
- Type your question naturally
- Optional: Select specific documents to search
- Get AI-powered answers with sources

### 3. View Analytics
- Check Analytics tab for insights
- Monitor usage patterns
- Track popular questions
- Export data as JSON

## ⚡ Performance

### Benchmarks (RTX 4050 GPU)

| Operation | GPU Time | CPU Time | Speedup |
|-----------|----------|----------|---------|
| Embedding Generation | 0.03s | 0.15s | 5x |
| Vector Search (10K docs) | 0.001s | 0.008s | 8x |
| Document Processing | 0.5s | 2.1s | 4.2x |

### Optimization Tips

1. **GPU Acceleration**: Install CUDA for 5-10x performance boost
2. **Batch Processing**: Upload multiple documents together
3. **Caching**: Enable Redis for frequently asked questions
4. **Model Selection**: Use smaller models in production for cost

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm run test
```

## 🐛 Troubleshooting

### Common Issues

1. **CUDA not available**
   - Install CUDA Toolkit 11.8+
   - Use `pip install faiss-gpu-cu11`

2. **Out of memory**
   - Reduce `CHUNK_SIZE` in config
   - Use smaller embedding model
   - Enable CPU-only mode

3. **Slow processing**
   - Check GPU availability
   - Reduce concurrent uploads
   - Use production config

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- FastAPI for the amazing web framework
- Sentence Transformers for embeddings
- Meta AI for FAISS
- All open-source contributors

## 📞 Contact

**Sai** - [@Joker2841](https://github.com/Joker2841)

Project Link: [https://github.com/Joker2841/document-qa-rag-new](https://github.com/Joker2841/document-qa-rag-new)

---

<div align="center">
Built with ❤️ using FastAPI and React
</div>
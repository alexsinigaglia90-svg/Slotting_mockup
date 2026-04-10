# Deployment Guide — Action Warehouse Slotting Module

## Quick Start

Get the system running locally in 6 commands.

### Prerequisites

- Python 3.12+
- Node.js 20+
- Git

### Backend Setup (3 commands)

```bash
# 1. Create virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# 2. Run tests to verify installation
pytest tests/ -v

# 3. Start the API server
python -m uvicorn slotting.api.app:create_app --reload --host 0.0.0.0 --port 8000
```

Backend is now live at **http://localhost:8000**

API docs available at **http://localhost:8000/docs** (Swagger UI)

### Frontend Setup (3 commands)

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

Frontend is now live at **http://localhost:3000**

---

## Environment Variables

### Backend

Create `.env` file in project root:

```bash
# slotting/.env
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info

# CORS configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optimizer settings
MAX_OPTIMIZATION_TIME_SECONDS=30
OPTIMIZER_ITERATIONS=100
```

Load in `slotting/api/app.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()
api_host = os.getenv("API_HOST", "0.0.0.0")
api_port = int(os.getenv("API_PORT", 8000))
```

### Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Running Tests

### Backend Unit Tests

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_optimizer.py -v

# With coverage
pytest tests/ --cov=slotting --cov-report=html
```

### Frontend Tests (Future)

```bash
cd frontend
npm test
```

---

## Production Deployment

### Docker Setup (Optional)

**Dockerfile** (backend):

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install -e .

COPY slotting slotting/
COPY tests tests/

EXPOSE 8000

CMD ["uvicorn", "slotting.api.app:create_app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t action-slotting:latest .
docker run -p 8000:8000 action-slotting:latest
```

### Cloud Deployment

#### Backend (Python/FastAPI)

**Option 1: Heroku**

```bash
# Create Heroku app
heroku create action-slotting-api

# Set environment
heroku config:set CORS_ORIGINS=https://action-slotting.vercel.app

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Procfile** (for Heroku):

```
web: uvicorn slotting.api.app:create_app --host 0.0.0.0 --port $PORT
```

**Option 2: AWS Lambda + API Gateway**

```bash
# Install serverless framework
npm install -g serverless

# Create Lambda wrapper
# Use asgiref to adapt ASGI to Lambda
# Deploy via serverless.yml
```

**Option 3: Google Cloud Run**

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/action-slotting

# Deploy
gcloud run deploy action-slotting \
  --image gcr.io/PROJECT_ID/action-slotting \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Frontend (Next.js)

**Deploy to Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Configure environment
# Set NEXT_PUBLIC_API_URL in Vercel dashboard
```

**Alternative: Self-hosted (AWS S3 + CloudFront)**

```bash
# Build static export
cd frontend
npm run build

# Upload to S3
aws s3 sync out/ s3://action-slotting-frontend/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

---

## Database Integration (Roadmap)

For production, add PostgreSQL to persist slotting assignments:

```python
# slotting/models/persistence.py
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

DATABASE_URL = "postgresql://user:password@localhost/action_slotting"
engine = create_engine(DATABASE_URL)

class StoredAssignment(Base):
    __tablename__ = "assignments"
    
    id = Column(Integer, primary_key=True)
    warehouse_id = Column(String)
    assignment_date = Column(DateTime, default=datetime.utcnow)
    sku_to_location = Column(JSON)  # Serialized dict
```

---

## Health Checks & Monitoring

### Health Endpoint

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "version": "0.2.0"
}
```

### Prometheus Metrics (Future)

Add to `slotting/api/app.py`:

```python
from prometheus_client import Counter, Histogram
from fastapi_prometheus_middleware import PrometheusMiddleware

app.add_middleware(PrometheusMiddleware)

optimize_duration = Histogram('optimize_seconds', 'Time to run optimization')
```

### Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"Optimization complete: {improvement_pct:.1f}% improvement")
```

---

## Performance Optimization

### Backend Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def compute_distance_matrix(warehouse_id: str):
    # Expensive computation, cached
    return graph.compute_all_pairs_distance()
```

### Frontend CDN

- Build Next.js with static generation (ISR) for dashboard pages
- Serve assets via CDN (CloudFlare, Fastly)
- Enable image optimization via `next/image`

### Database Indexing

```sql
CREATE INDEX idx_assignments_warehouse_date 
  ON assignments(warehouse_id, assignment_date);
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check Python version
python --version  # Must be 3.12+

# Check virtual environment
which python  # Should be in .venv/

# Reinstall dependencies
pip install -e ".[dev]" --force-reinstall
```

### CORS Errors in Browser

```bash
# Verify CORS configuration in app.py
# Check that frontend URL matches CORS_ORIGINS

# Temporary fix for development:
# Disable CORS checks in browser (NOT for production)
# Or run frontend with --cors flag
```

### Optimization Takes Too Long

```python
# Reduce max iterations in OptimizeRequest
{
  "max_iterations": 50  # Lower from default 100
}

# Or increase timeout
OPTIMIZER_TIMEOUT_SECONDS=60
```

### Frontend Can't Reach Backend

```bash
# Check backend is running
curl http://localhost:8000/health

# Check NEXT_PUBLIC_API_URL in frontend/.env.local
# Should be http://localhost:8000 in dev

# Check browser console for network errors
```

---

## Production Checklist

- [ ] Tests passing: `pytest tests/ -v`
- [ ] Environment variables configured
- [ ] Database migrated (if using PostgreSQL)
- [ ] CORS configured for production domain
- [ ] Error logging and monitoring enabled
- [ ] API rate limiting configured
- [ ] SSL/TLS enabled (HTTPS)
- [ ] Health checks responding
- [ ] Database backups scheduled
- [ ] Rollback plan documented

---

## Rollback Procedure

If production deploy breaks:

```bash
# Revert to previous version
git revert HEAD

# Rebuild and redeploy
docker build -t action-slotting:v1.0.0 .
docker run -p 8000:8000 action-slotting:v1.0.0

# Or via git
git checkout v1.0.0
git push heroku v1.0.0:main
```

---

## Scaling Strategy

### Vertical Scaling (Single Server)

- Increase server CPU/RAM
- Optimize database queries
- Use connection pooling (pgBouncer)

### Horizontal Scaling (Multiple Servers)

- Run multiple backend instances behind load balancer (nginx)
- Deploy frontend to CDN (Vercel, CloudFlare Pages)
- Distribute database across replicas (PostgreSQL streaming replication)

### Caching Layer

```python
from redis import Redis

cache = Redis(host='localhost', port=6379)

@app.get("/optimize")
def optimize(request: OptimizeRequest):
    cache_key = f"optimize_{request.warehouse_seed}_{request.max_iterations}"
    cached = cache.get(cache_key)
    if cached:
        return json.loads(cached)
    
    result = run_optimization(request)
    cache.setex(cache_key, 3600, json.dumps(result))  # Cache 1 hour
    return result
```

---

## Security Considerations

### API Security

- [ ] Enable HTTPS (TLS 1.3)
- [ ] Implement API key authentication
- [ ] Rate limit requests (e.g., 100 req/min per IP)
- [ ] Validate all inputs (Pydantic handles this)
- [ ] Disable debug mode in production

### Data Security

- [ ] Never log sensitive warehouse data
- [ ] Encrypt database at rest
- [ ] Use environment variables for secrets (not hardcoded)
- [ ] Implement access control (who can optimize which warehouse)

---

## Support & Resources

- **Backend Docs:** http://localhost:8000/docs (Swagger UI)
- **API Reference:** `/docs/api-reference.md`
- **Architecture:** `/docs/architecture.md`
- **Issues:** GitHub Issues

---

**Version:** 0.2.0  
**Last Updated:** 2026-04-10

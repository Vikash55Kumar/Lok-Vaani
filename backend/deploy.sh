#!/bin/bash

# Cloud Run deployment script for Lok Vaani Backend

echo "🚀 Deploying to Cloud Run..."

gcloud run deploy lok-vaani-test \
  --source . \
  --region asia-south2 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production

echo "✅ Deployment complete!"

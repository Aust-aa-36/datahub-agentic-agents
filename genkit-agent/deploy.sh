#!/bin/bash

# Genkit Agent Deployment Script
# Usage: ./deploy.sh [service-name]

SERVICE_NAME=${1:-datahub-genkit-agent}
REGION="us-central1"

echo "🚀 Starting deployment for service: $SERVICE_NAME..."

# 1. Build and Push using Google Cloud Build
echo "📦 Building container image..."
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/$SERVICE_NAME

# 2. Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$(gcloud config get-value project)/$SERVICE_NAME \
  --region $REGION \
  --allow-unauthenticated \
  --port 3400

echo "✅ Deployment complete!"
echo "🔗 Service URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"

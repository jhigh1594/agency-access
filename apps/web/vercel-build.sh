#!/bin/bash
set -e

# Navigate to repository root
cd "$(dirname "$0")/../.."

# Install dependencies
npm install

# Build shared package and web app
npm run build:web


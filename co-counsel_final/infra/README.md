# Infrastructure

Infrastructure configurations for the Co-Counsel platform.

## Overview

This directory contains all infrastructure-as-code configurations for deploying the Co-Counsel platform in various environments.

**Note:** For most users, we recommend using the root-level Docker Compose file and launcher scripts which provide a simpler way to start the complete stack. See the [root README](../README.md) for details.

## Directory Structure
```
infra/
├── profiles/              # Environment-specific configurations
│   ├── dev.env           # Development deployment defaults
│   ├── prod.env          # Production deployment defaults (full-featured)
│   └── gpu.env           # Optional CUDA overlay (use with --env-file)
├── helm/                  # Helm charts for Kubernetes deployments
│   └── full-stack/       # Complete platform Helm chart
├── terraform/             # Terraform modules for cloud infrastructure
│   ├── modules/          # Reusable Terraform modules
│   └── environments/     # Environment-specific configurations
├── windows/               # Windows-specific deployment scripts
│   ├── scripts/          # PowerShell installation scripts
│   └── assets/           # Windows installer assets
├── grafana/               # Grafana dashboards and configurations
├── migrations/            # Database migration scripts
└── otel-collector-config.yaml  # OpenTelemetry collector configuration
```

## Deployment Options

### Quick Start (Recommended)
From the project root directory:
```bash
# On Linux/macOS
./start.sh

# On Windows
start.bat
```

### Manual Docker Compose Deployment
```bash
docker compose --project-directory . up -d
```

### Production (Helm + Kubernetes)
```bash
helm install cocounsel ./helm/full-stack
```

### Cloud Infrastructure (Terraform)
```bash
cd terraform/environments/enterprise
terraform init
terraform apply
```

## Environment Profiles

- **Dev**: Local development defaults with minimal services
- **Prod**: Full-featured production defaults with telemetry, voice, and backups
- **GPU overlay**: Optional CUDA enablement for services that can leverage acceleration

## Windows Deployment

For Windows users, a one-click installer is available:
```powershell
powershell -File .\windows\scripts\install.ps1
```

## Monitoring and Observability

- **Grafana**: http://localhost:3000 (prod profile only)
- **Neo4j Browser**: http://localhost:7474
- **Qdrant Console**: http://localhost:6333/dashboard

# Architecture overview

This document shows a high-level architecture overview for the project using a Mermaid diagram.

```mermaid
flowchart LR
  subgraph Users
    U[Users]
  end

  subgraph Frontend
    FE[Web UI\n(TypeScript / HTML)]
  end

  subgraph API
    GW[API Gateway\n(Python Flask/FastAPI)]
    AUTH[Auth Service\n(Python)]
  end

  subgraph Processing
    NB[Jupyter Notebooks\n(Notebook jobs)]
    WORK[Worker\n(Go / Python)]
    TASKQ[Task Queue\n(Redis / RabbitMQ)]
  end

  subgraph Storage
    S3[Object Storage\n(S3 / MinIO)]
    DB[(Database)\n(Postgres / SQLite)]
  end

  subgraph CI
    GH[GitHub Repo\n(ahouse2/1_30_26)]
    ACTIONS[CI / CD\n(GitHub Actions)]
  end

  U --> FE
  FE --> GW
  FE --> AUTH
  GW --> TASKQ
  GW --> DB
  TASKQ --> WORK
  WORK --> NB
  NB --> S3
  WORK --> S3
  WORK --> DB
  GH --> ACTIONS
  ACTIONS --> GW
  ACTIONS --> FE
  GH --> NB

  classDef infra fill:#f9f,stroke:#333,stroke-width:1px;
  class S3,DB,GW,TASKQ,ACTIONS infra
```

Notes:
- Users interact with a TypeScript/HTML frontend which communicates with a Python API gateway.
- The API enqueues jobs to a task queue; workers (Go or Python) run notebook jobs and persist outputs to object storage and a database.
- CI/CD is provided by GitHub Actions, which runs tests and deploys the frontend and backend.

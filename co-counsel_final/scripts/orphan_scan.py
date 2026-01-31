#!/usr/bin/env python3
"""
Scan for files outside the allowed folder canon to enforce repo hygiene.
Allowed roots: apps, backend, services, agents, tools, frontend, infra, docs, runbooks, build_logs, memory, scripts, AgentsMD_PRPs_and_AgentMemory, Reference Code, agents and tools, previous builds
"""
import os
import sys

ALLOWED = {
    "apps",
    "backend",
    "services",
    "agents",
    "tools",
    "frontend",
    "infra",
    "docs",
    "runbooks",
    "build_logs",
    "memory",
    "scripts",
    "AgentsMD_PRPs_and_AgentMemory",
    "Reference Code",
    "agents and tools",
    "previous builds",
    ".git",
    ".gitattributes",
    ".gitignore",
    "README.md",
    "ONBOARDING.md",
    "QUICKSTART.md",
    "AGENTS.md",
}

def main():
    root = os.getcwd()
    offenders = []
    for entry in os.listdir(root):
        if entry in ALLOWED:
            continue
        offenders.append(entry)
    if offenders:
        print("Orphan entries detected:")
        for e in offenders:
            print(" -", e)
        sys.exit(1)
    print("No orphans detected.")

if __name__ == "__main__":
    main()


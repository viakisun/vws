#!/bin/bash

echo "=== PNPM Debug Information ==="
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "OS: $(uname -a)"
echo "PWD: $(pwd)"
echo ""

echo "=== pnpm config ==="
pnpm config list
echo ""

echo "=== Workspace config ==="
echo "pnpm-workspace.yaml:"
cat pnpm-workspace.yaml
echo ""

echo "=== Lockfile info ==="
echo "Lockfile version: $(head -1 pnpm-lock.yaml)"
echo "Lockfile size: $(wc -l < pnpm-lock.yaml) lines"
echo ""

echo "=== Overrides comparison ==="
echo "Workspace overrides:"
grep -A 5 "overrides:" pnpm-workspace.yaml
echo ""
echo "Lockfile overrides:"
grep -A 5 "overrides:" pnpm-lock.yaml
echo ""

echo "=== Environment variables ==="
env | grep -E "(PNPM|NPM|NODE)" | sort
echo ""

echo "=== Attempting frozen install with verbose output ==="
pnpm install --frozen-lockfile --reporter=verbose --loglevel=debug


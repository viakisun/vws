#!/bin/bash

# =============================================================================
# VWS Test Database Setup Script
# =============================================================================
# This script sets up the PostgreSQL test database for integration and E2E tests
#
# Usage:
#   ./scripts/setup-test-db.sh
#
# Prerequisites:
#   - PostgreSQL 15+ installed
#   - psql command available
#
# Environment Variables:
#   TEST_DB_USER (default: testuser)
#   TEST_DB_PASS (default: testpass)
#   TEST_DB_NAME (default: vws_test)
#   TEST_DB_HOST (default: localhost)
#   TEST_DB_PORT (default: 5432)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_USER="${TEST_DB_USER:-testuser}"
TEST_DB_PASS="${TEST_DB_PASS:-testpass}"
TEST_DB_NAME="${TEST_DB_NAME:-vws_test}"
TEST_DB_HOST="${TEST_DB_HOST:-localhost}"
TEST_DB_PORT="${TEST_DB_PORT:-5432}"

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_info() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

check_postgres() {
    print_header "Checking PostgreSQL Installation"
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) not found"
        echo ""
        echo "Please install PostgreSQL 15+:"
        echo "  macOS:   brew install postgresql@15"
        echo "  Ubuntu:  sudo apt-get install postgresql-15"
        echo "  Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
    
    print_info "PostgreSQL client found"
    psql --version
}

create_test_user() {
    print_header "Creating Test Database User"
    
    # Check if user already exists
    export PGPASSWORD="$TEST_DB_PASS"
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$TEST_DB_USER'" | grep -q 1; then
        print_warning "User '$TEST_DB_USER' already exists"
    else
        # Create user
        if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -c "CREATE USER $TEST_DB_USER WITH PASSWORD '$TEST_DB_PASS';" &> /dev/null; then
            print_info "User '$TEST_DB_USER' created successfully"
        else
            print_error "Failed to create user '$TEST_DB_USER'"
            print_warning "Trying alternative method (you may need to run with sudo)"
            sudo -u postgres psql -c "CREATE USER $TEST_DB_USER WITH PASSWORD '$TEST_DB_PASS';" || true
        fi
    fi
}

create_test_database() {
    print_header "Creating Test Database"
    
    # Check if database already exists
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TEST_DB_NAME'" | grep -q 1; then
        print_warning "Database '$TEST_DB_NAME' already exists - dropping and recreating"
        psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" &> /dev/null || true
    fi
    
    # Create database
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -c "CREATE DATABASE $TEST_DB_NAME OWNER $TEST_DB_USER;" &> /dev/null; then
        print_info "Database '$TEST_DB_NAME' created successfully"
    else
        print_error "Failed to create database '$TEST_DB_NAME'"
        print_warning "Trying alternative method"
        sudo -u postgres psql -c "CREATE DATABASE $TEST_DB_NAME OWNER $TEST_DB_USER;" || exit 1
    fi
}

grant_privileges() {
    print_header "Granting Privileges"
    
    # Grant all privileges
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $TEST_DB_NAME TO $TEST_DB_USER;" &> /dev/null; then
        print_info "Privileges granted to '$TEST_DB_USER'"
    else
        print_warning "Could not grant privileges (may already be set)"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $TEST_DB_NAME TO $TEST_DB_USER;" || true
    fi
}

import_schema() {
    print_header "Importing Database Schema"
    
    # Find schema file
    SCHEMA_FILE="aws-schema.sql"
    if [ ! -f "$SCHEMA_FILE" ]; then
        print_warning "Schema file '$SCHEMA_FILE' not found, trying alternative"
        SCHEMA_FILE="aws-schema-fixed.sql"
        if [ ! -f "$SCHEMA_FILE" ]; then
            print_error "No schema file found!"
            return 1
        fi
    fi
    
    print_info "Using schema file: $SCHEMA_FILE"
    
    # Import schema
    export PGPASSWORD="$TEST_DB_PASS"
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -f "$SCHEMA_FILE" &> /dev/null; then
        print_info "Schema imported successfully"
    else
        print_warning "Schema import completed with warnings (this is often normal)"
    fi
}

verify_setup() {
    print_header "Verifying Setup"
    
    # Test connection
    export PGPASSWORD="$TEST_DB_PASS"
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "SELECT 1;" &> /dev/null; then
        print_info "Connection test successful"
    else
        print_error "Connection test failed"
        return 1
    fi
    
    # Count tables
    TABLE_COUNT=$(psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    print_info "Found $TABLE_COUNT tables in database"
    
    # List tables
    echo ""
    echo "Tables in database:"
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "\dt" | grep -v "^(" | grep -v "^$" || true
}

create_env_file() {
    print_header "Creating .env.test File"
    
    ENV_FILE=".env.test"
    if [ -f "$ENV_FILE" ]; then
        print_warning "File '$ENV_FILE' already exists - skipping"
    else
        cat > "$ENV_FILE" << EOF
# Test Environment Variables
# Generated by setup-test-db.sh

# Database
DATABASE_URL=postgresql://$TEST_DB_USER:$TEST_DB_PASS@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME

# Authentication
JWT_SECRET=test_jwt_secret_key_for_testing_only

# Application
NODE_ENV=test
PUBLIC_APP_URL=http://localhost:4173

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRY_COUNT=2
EOF
        print_info "Created $ENV_FILE"
    fi
}

print_summary() {
    print_header "Setup Complete!"
    
    echo ""
    echo -e "${GREEN}Test database is ready!${NC}"
    echo ""
    echo "Connection details:"
    echo "  Host:     $TEST_DB_HOST"
    echo "  Port:     $TEST_DB_PORT"
    echo "  Database: $TEST_DB_NAME"
    echo "  User:     $TEST_DB_USER"
    echo "  Password: $TEST_DB_PASS"
    echo ""
    echo "Connection string:"
    echo "  DATABASE_URL=postgresql://$TEST_DB_USER:$TEST_DB_PASS@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"
    echo ""
    echo "Next steps:"
    echo "  1. Run unit tests:        pnpm test:unit"
    echo "  2. Run integration tests: pnpm test:integration"
    echo "  3. Run E2E tests:         pnpm test:e2e"
    echo "  4. Run all tests:         pnpm test"
    echo ""
}

# Main execution
main() {
    echo ""
    print_header "VWS Test Database Setup"
    echo ""
    
    check_postgres
    echo ""
    
    create_test_user
    echo ""
    
    create_test_database
    echo ""
    
    grant_privileges
    echo ""
    
    import_schema
    echo ""
    
    verify_setup
    echo ""
    
    create_env_file
    echo ""
    
    print_summary
}

# Run main function
main "$@"

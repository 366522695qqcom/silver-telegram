# AI API Gateway - Product Requirement Document

## Overview
- **Summary**: A unified AI API calling gateway that supports multiple AI providers through a single API key and endpoint, with real-time monitoring capabilities
- **Purpose**: To provide personal developers with a centralized platform to manage, monitor, and access multiple AI models from different providers
- **Target Users**: Personal developers and small teams needing unified AI API access

## Goals
- [x] Unified API interface for all AI providers
- [x] Support for any OpenAI-compatible API endpoints
- [x] Flexible provider configuration (API keys, base URLs)
- [x] Real-time monitoring of API calls and performance
- [x] Connectivity testing for providers
- [x] Dynamic model list retrieval
- [x] Apple-style UI design
- [x] SQLite database for local deployment
- [x] Cookie-based authentication
- [x] Audit logging for operations

## Non-Goals (Out of Scope)
- [ ] Enterprise-level multi-tenant support
- [ ] Complex team collaboration features
- [ ] PostgreSQL database (using SQLite instead)
- [ ] Mobile app development
- [ ] Third-party service integrations beyond AI providers

## Background & Context
The AI API Gateway is a complete, production-ready project with all core features implemented. It includes:
- Backend built with Node.js + Express
- Frontend built with React 19 + TypeScript + Vite + TailwindCSS
- Real-time updates via Socket.IO
- Authentication via JWT + Cookie
- Cost tracking and quota management
- Comprehensive audit logging system

## Functional Requirements
- **FR-1**: User Registration & Authentication
- **FR-2**: API Key Management
- **FR-3**: AI Provider Configuration
- **FR-4**: Unified Chat Completions API
- **FR-5**: Real-time Monitoring
- **FR-6**: Audit Logging
- **FR-7**: Cost Management
- **FR-8**: Quota Management

## Non-Functional Requirements
- **NFR-1**: Local deployment friendly (SQLite database)
- **NFR-2**: Apple-style clean UI design
- **NFR-3**: Real-time statistics updates within 1 second
- **NFR-4**: Support for HTTPS cookie authentication
- **NFR-5**: Responsive design for desktop and mobile

## Constraints
- **Technical**: Backend - Node.js + Express; Frontend - React 19 + TypeScript + Vite; Database - SQLite
- **Dependencies**: Express, Socket.IO, Axios, bcrypt, jsonwebtoken, React, TailwindCSS, Zustand
- **Technical**: Local-first design with SQLite for easy deployment

## Assumptions
- [x] Single-user or small team usage
- [x] Users have their own AI provider API keys
- [x] Deployment on personal VPS or cloud server
- [x] Basic HTTPS setup for cookie authentication

## Acceptance Criteria

### AC-1: User Registration & Login
- **Given**: User accesses the platform
- **When**: User registers with email/password or logs in
- **Then**: User is authenticated with JWT + Cookie and can access dashboard
- **Verification**: `human-judgment`

### AC-2: Provider Configuration
- **Given**: User is logged in
- **When**: User adds/edits/deletes AI provider configurations
- **Then**: Provider settings are saved and accessible
- **Verification**: `human-judgment`

### AC-3: Connectivity Testing
- **Given**: User has configured a provider
- **When**: User clicks "Test Connection"
- **Then**: Connection status and model list are displayed
- **Verification**: `human-judgment`

### AC-4: API Key Management
- **Given**: User is logged in
- **When**: User creates/edits/deletes API keys
- **Then**: API keys are managed securely and available for use
- **Verification**: `human-judgment`

### AC-5: Unified API Calling
- **Given**: User has valid API key and configured providers
- **When**: User makes chat completion request through gateway
- **Then**: Request is routed to specified provider and response returned
- **Verification**: `programmatic`

### AC-6: Real-time Monitoring
- **Given**: User is on monitoring page
- **When**: API calls are made
- **Then**: Dashboard shows real-time statistics and charts
- **Verification**: `human-judgment`

### AC-7: Audit Logs
- **Given**: User performs operations
- **When**: User views audit logs
- **Then**: Complete audit trail is visible with timestamps
- **Verification**: `human-judgment`

## Open Questions
- [ ] None - project is complete and fully functional

---

## Project Structure Overview

### Backend Structure ([/workspace/src/](file:///workspace/src/))
- **config/**: Database and logger configuration
- **middleware/**: Authentication and rate limiting
- **routes/**: API endpoints for auth, providers, chat, monitor, audit, cost
- **services/**: Core business logic (provider service, audit service, etc.)
- **utils/**: Cache, database utilities, retry logic
- **server.js**: Main server entry point

### Frontend Structure ([/workspace/frontend/src/](file:///workspace/frontend/src/))
- **components/**: Reusable UI components
- **pages/**: Page components (Login, Home, Settings, ApiKeys, Monitor, AuditLogs)
- **services/**: API client and services
- **store/**: Zustand state management
- **types/**: TypeScript type definitions
- **App.tsx**: Main app component with routing

### Key Files
- [README.md](file:///workspace/README.md): Project overview and API documentation
- [docs/project-spec.md](file:///workspace/docs/project-spec.md): Detailed technical specification
- [.trae/documents/arch.md](file:///workspace/.trae/documents/arch.md): Architecture design
- [.trae/documents/prd.md](file:///workspace/.trae/documents/prd.md): Product requirements

---

## Current Status
- **Status**: Complete, production-ready
- **Version**: v3.0.0
- **Last Updated**: 2026-05-09
- **Key Bugs Fixed**: Provider detail panel display, API key copy, cookie authentication

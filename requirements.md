# BioPass Swarm - Requirements & Architecture

## Original Problem Statement
Build a secure biometric login web app called "BioPass Swarm" with ultra-advanced encryption security.

### UI/UX Requirements
- Dark blue background (#0A0A1A) with neon cyan glow accents (#00FFFF)
- Futuristic, minimal, sleek design with rounded corners and glassmorphism cards
- Front page: "BioPass Swarm" title, subtitle "Universal quantum-safe biometric access"
- Help & Chat button top right
- Detected device note (e.g., "Detected: Web Interface")
- Required Permissions section with WebAuthn and Camera badges
- Setup Progress bar (horizontal, cyan fill)
- 3 Steps sections (collapsible cards):
  1. Security Key / Biometric with WebAuthn
  2. Liveness Check with anti-deepfake verification
  3. Heartbeat PPG with pulse waveform detection
- Notes section about quantum-safe cryptography
- Configuration section with Region & Language dropdown and Recovery Email
- Revoke Permissions popup modal
- PWA support for mobile/browser
- Copyright: SoftTechX Ltd

### Backend Security Requirements
- Post-quantum encryption (CRYSTALS-Kyber + CRYSTALS-Dilithium simulation)
- All biometric data encrypted on-device
- Liveness check with blink detection
- Heartbeat PPG from camera green channel analysis
- Chat help with Claude Sonnet 4.5 via Emergent LLM key

### External API Integration
- Base URL: https://cmj1nqwjn7tk4yprgudqvroco.agent.pa.smyth.ai
- Endpoints: /api/status, /api/quantum_challenge, /api/camera_capture, /api/heartbeat_guardian, /api/biopass_v3_enrollment, /api/biopass_v3_auth, /api/privacy_policy, /api/usage_guide

## Architecture Completed

### Backend (FastAPI)
- `/app/backend/server.py` - Main API server with:
  - Session management with quantum-safe key generation
  - Post-quantum encryption simulation (Kyber + Dilithium)
  - AES-256-GCM encryption for biometric data
  - Claude Sonnet 4.5 integration via Emergent integrations
  - External BioPass API proxy endpoints
  - Chat, recovery email, permissions, and step tracking APIs

### Frontend (React + Tailwind)
- `/app/frontend/src/pages/BioPassHome.jsx` - Main page with:
  - WebAuthn authentication flow
  - Camera access with liveness detection
  - PPG waveform visualization
  - Collapsible step cards with progress tracking
  - Chat modal with AI assistant
  - Region/Language configuration
  - Revoke permissions modal
  
### Styling
- `/app/frontend/src/index.css` - Global styles with custom CSS variables
- `/app/frontend/src/App.css` - Component-specific styles
- `/app/frontend/tailwind.config.js` - Custom theme configuration

### PWA Support
- `/app/frontend/public/manifest.json` - PWA manifest
- `/app/frontend/public/index.html` - Meta tags for PWA

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ | Health check |
| POST | /api/session/create | Create enrollment session with quantum keys |
| GET | /api/session/{id} | Get session details |
| PATCH | /api/session/{id}/permissions | Update permission status |
| POST | /api/session/{id}/step | Update step progress |
| POST | /api/chat | Chat with AI assistant |
| POST | /api/quantum-challenge | Generate quantum-resistant challenge |
| POST | /api/recovery-email | Set recovery email |
| GET | /api/external/status | External API status |
| GET | /api/external/privacy-policy | Get privacy policy |
| GET | /api/external/usage-guide | Get usage guide |

## Next Action Items

### Phase 2 Enhancements
1. Implement real WebAuthn credential storage and verification
2. Add actual face detection using TensorFlow.js for liveness check
3. Implement real PPG signal processing from camera green channel
4. Add service worker for offline PWA functionality
5. Integrate with actual post-quantum crypto libraries (liboqs) when available
6. Add biometric data export/import functionality
7. Implement multi-device sync with encrypted cloud backup

### Security Improvements
1. Add rate limiting to sensitive endpoints
2. Implement CSRF protection
3. Add audit logging for all biometric operations
4. Implement session timeout and auto-revocation
5. Add hardware security module (HSM) integration option

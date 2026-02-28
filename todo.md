# AutoPilot Project TODO

## Phase 1: Core Database & Auth
- [x] Update schema.ts with all tables (users, bookings, knowledgeBase, emailConversations, whatsappConversations, payments, invoices, etc.)
- [x] Create database migrations
- [x] Implement tier/trial logic in auth system
- [x] Implement early adopter counter with atomic operations
- [x] Add usage tracking system
- [x] Create admin procedures for user management

## Phase 2: Booking System
- [x] Create booking CRUD procedures
- [x] Implement booking list with pagination
- [ ] Add calendar view component
- [ ] Implement no-show prevention (reminder system)
- [ ] Create admin booking dashboard
- [x] Add booking status management (pending, confirmed, completed, cancelled, no-show)
- [ ] Implement public booking page submission

## Phase 3: Email Auto-Reply System
- [x] Create email conversation tracking procedures
- [ ] Implement email conversation list UI
- [x] Build AI reply generation using knowledge base context
- [ ] Create email reply UI with preview
- [x] Implement conversation history display
- [x] Add flag-for-review functionality
- [ ] Integrate SendGrid/Nodemailer for sending replies
- [ ] Add email sync/webhook handling

## Phase 4: WhatsApp Auto-Reply System
- [x] Create WhatsApp conversation tracking procedures
- [ ] Implement WhatsApp conversation list UI
- [x] Build AI reply generation using knowledge base context
- [ ] Create WhatsApp reply UI with preview
- [x] Implement conversation threading
- [x] Add flag-for-review functionality
- [ ] Integrate Twilio/Meta Cloud API for sending replies
- [ ] Add WhatsApp webhook handling

## Phase 5: Knowledge Base CMS
- [x] Create knowledge base CRUD procedures
- [ ] Implement knowledge base list UI
- [ ] Add article creation/editing UI (paid tiers only)
- [x] Implement search functionality
- [x] Add category management
- [ ] Create default template for free tier (read-only)
- [x] Add knowledge base preview in reply generation

## Phase 6: Payment & Subscription System
- [x] Integrate PayPal REST API (stubs ready)
- [x] Create payment procedures
- [ ] Implement PayPal webhook handling
- [x] Add invoice generation (PDF)
- [ ] Create payment history UI
- [x] Implement refund request system
- [ ] Add subscription tier upgrade/downgrade
- [ ] Create payment receipt notifications

## Phase 7: Analytics Dashboard
- [x] Create analytics procedures
- [ ] Build booking analytics UI (count, conversion rate, no-show rate)
- [ ] Build response analytics UI (email/WhatsApp response rates)
- [ ] Build revenue analytics UI (Pro tier only)
- [ ] Add date range filtering
- [ ] Create custom reports (Pro tier only)
- [ ] Add export functionality

## Phase 8: Branded Booking Page
- [x] Create branded booking page procedures
- [ ] Build page customization UI (logo, colors, description)
- [ ] Implement custom domain support
- [ ] Add public page preview
- [x] Create page activation/deactivation toggle
- [x] Implement slug-based public URLs

## Phase 9: Notifications & Automation
- [ ] Create notification procedures
- [ ] Implement booking confirmation emails
- [ ] Implement booking reminder emails (24h before)
- [ ] Implement payment receipt emails
- [ ] Implement owner alerts for new inquiries
- [ ] Add notification preferences UI
- [ ] Implement scheduled notification jobs

## Phase 10: Feature Flag Enforcement
- [ ] Add tier checks to all endpoints
- [ ] Implement usage limit enforcement
- [ ] Add feature availability checks
- [ ] Create tier-based UI hiding
- [ ] Implement upgrade prompts
- [ ] Add usage tracking on every action

## Phase 11: Admin Dashboard
- [ ] Create admin-only procedures
- [ ] Build user management UI
- [ ] Add early adopter counter display
- [ ] Create trial status monitoring
- [ ] Add manual tier adjustment (admin only)
- [ ] Implement user search and filtering

## Phase 12: Frontend Layout & Navigation
- [ ] Create main dashboard layout
- [ ] Build sidebar navigation
- [ ] Implement user profile menu
- [ ] Add tier display in header
- [ ] Create feature-gated navigation items
- [ ] Build mobile-responsive design

## Phase 13: Testing & Optimization
- [ ] Write vitest tests for auth system
- [ ] Write vitest tests for booking procedures
- [ ] Write vitest tests for tier/usage enforcement
- [ ] Write vitest tests for AI reply generation
- [ ] Write vitest tests for payment procedures
- [ ] Performance optimization (query indexing, caching)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Load testing

## Phase 14: Deployment & Launch
- [ ] Environment variable setup
- [ ] Database backup strategy
- [ ] Monitoring and logging setup
- [ ] Create deployment documentation
- [ ] Final QA testing
- [ ] Create checkpoint for deployment
- [ ] Deploy to production
- [ ] Monitor for issues

## Phase 15: Launch & Outreach
- [ ] Identify first 10 ideal customers
- [ ] Create personalized outreach materials
- [ ] Generate cold email sequences
- [ ] Create landing page for early adopters
- [ ] Set up feedback collection
- [ ] Plan post-launch support

## URGENT: Model Switch
- [x] Replace OpenAI GPT-4o with Google Gemini 2.5 Pro in all LLM calls
- [x] Add GEMINI_API_KEY to environment variables via Secrets panel
- [x] Update email-replies-router.ts to use Gemini
- [x] Update whatsapp-replies-router.ts to use Gemini
- [x] Test Gemini integration with email and WhatsApp reply generation

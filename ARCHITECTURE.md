# AutoPilot Architecture & Schema Design

## System Overview

AutoPilot is a full-stack AI-powered business automation platform for SMBs with:
- **Multi-tier subscriptions** (Free, Basic, Pro) with feature flags and usage limits
- **Smart booking system** with calendar, reminders, and no-show prevention
- **AI auto-replies** for Email and WhatsApp using knowledge base context
- **Knowledge base CMS** with categories and search
- **Admin dashboard** with analytics (bookings, response rates, revenue)
- **Branded booking pages** with custom domains
- **Payment processing** (PayPal) with invoicing and refund handling
- **Automated notifications** for confirmations, reminders, receipts, and alerts

---

## Database Schema

### Core Tables

#### `users`
- `id` (PK, auto-increment)
- `openId` (unique, from OAuth)
- `name`, `email`, `loginMethod`
- `role` (enum: user, admin)
- `subscriptionTier` (enum: free, basic, pro)
- `trialStartedAt` (timestamp)
- `trialDaysRemaining` (int, default 30 for standard, 90 for early adopter)
- `isEarlyAdopter` (boolean)
- `trialConvertedAt` (timestamp, null until converted)
- `createdAt`, `updatedAt`, `lastSignedIn`

#### `earlyAdopterCounter`
- `id` (PK)
- `slotsUsed` (int, default 0)
- `maxSlots` (int, default 10)
- `updatedAt` (timestamp)

#### `subscriptionTiers`
- `id` (PK)
- `name` (enum: free, basic, pro)
- `monthlyPrice` (decimal)
- `bookingsPerMonth` (int, -1 for unlimited)
- `emailRepliesPerMonth` (int, -1 for unlimited)
- `whatsappRepliesPerMonth` (int, -1 for unlimited)
- `socialRepliesPerMonth` (int, -1 for unlimited)
- `knowledgeBaseEditable` (boolean)
- `brandedBookingPage` (boolean)
- `paypalPayments` (boolean)
- `teamMembers` (int)
- `analyticsLevel` (enum: basic, full)

#### `bookings`
- `id` (PK)
- `userId` (FK to users)
- `title` (string)
- `description` (text)
- `startTime` (timestamp)
- `endTime` (timestamp)
- `customerName` (string)
- `customerEmail` (string)
- `customerPhone` (string)
- `status` (enum: pending, confirmed, completed, cancelled, no-show)
- `reminderSentAt` (timestamp, nullable)
- `confirmationSentAt` (timestamp, nullable)
- `paymentStatus` (enum: pending, paid, failed, refunded)
- `paymentId` (string, nullable)
- `amount` (decimal)
- `createdAt`, `updatedAt`

#### `knowledgeBase`
- `id` (PK)
- `userId` (FK to users)
- `category` (string)
- `title` (string)
- `content` (text)
- `isDefault` (boolean, true for free tier default template)
- `searchKeywords` (text, comma-separated)
- `createdAt`, `updatedAt`

#### `emailConversations`
- `id` (PK)
- `userId` (FK to users)
- `senderEmail` (string)
- `subject` (string)
- `messageHistory` (JSON, array of {role, content, timestamp})
- `lastMessageAt` (timestamp)
- `autoReplyGenerated` (boolean)
- `autoReplyContent` (text, nullable)
- `flaggedForReview` (boolean)
- `createdAt`, `updatedAt`

#### `whatsappConversations`
- `id` (PK)
- `userId` (FK to users)
- `customerPhone` (string)
- `messageHistory` (JSON, array of {role, content, timestamp})
- `lastMessageAt` (timestamp)
- `autoReplyGenerated` (boolean)
- `autoReplyContent` (text, nullable)
- `flaggedForReview` (boolean)
- `createdAt`, `updatedAt`

#### `usageTracking`
- `id` (PK)
- `userId` (FK to users)
- `month` (date, first day of month)
- `bookingsUsed` (int)
- `emailRepliesUsed` (int)
- `whatsappRepliesUsed` (int)
- `socialRepliesUsed` (int)
- `createdAt`, `updatedAt`

#### `payments`
- `id` (PK)
- `userId` (FK to users)
- `bookingId` (FK to bookings, nullable)
- `subscriptionId` (string, nullable)
- `amount` (decimal)
- `currency` (string, default USD)
- `paymentMethod` (enum: paypal, stripe)
- `paymentId` (string, unique)
- `status` (enum: pending, completed, failed, refunded)
- `invoiceId` (string, nullable)
- `refundId` (string, nullable)
- `refundReason` (text, nullable)
- `createdAt`, `updatedAt`

#### `invoices`
- `id` (PK)
- `userId` (FK to users)
- `paymentId` (FK to payments)
- `invoiceNumber` (string, unique)
- `amount` (decimal)
- `description` (text)
- `pdfUrl` (string, nullable)
- `sentAt` (timestamp, nullable)
- `createdAt`, `updatedAt`

#### `brandedBookingPages`
- `id` (PK)
- `userId` (FK to users)
- `slug` (string, unique)
- `customDomain` (string, nullable)
- `logoUrl` (string, nullable)
- `primaryColor` (string, default #000000)
- `secondaryColor` (string, default #FFFFFF)
- `description` (text)
- `isActive` (boolean)
- `createdAt`, `updatedAt`

#### `notifications`
- `id` (PK)
- `userId` (FK to users)
- `type` (enum: booking_confirmation, booking_reminder, payment_receipt, owner_alert, new_inquiry)
- `recipientEmail` (string)
- `subject` (string)
- `body` (text)
- `status` (enum: pending, sent, failed)
- `sentAt` (timestamp, nullable)
- `createdAt`, `updatedAt`

---

## Feature Flags & Usage Limits

### Free Tier
- Bookings: 10/month
- Email auto-replies: 20/month
- WhatsApp auto-replies: 20/month
- Social auto-replies: 10/month
- Knowledge base: Read-only default template
- Branded booking page: ❌
- PayPal payments: ❌
- Team members: 1
- Analytics: Basic (summary only)

### Basic Tier
- Bookings: 100/month
- Email auto-replies: 100/month
- WhatsApp auto-replies: 100/month
- Social auto-replies: 50/month
- Knowledge base: Editable (5 articles)
- Branded booking page: ✅
- PayPal payments: ✅
- Team members: 3
- Analytics: Full

### Pro Tier
- Bookings: Unlimited
- Email auto-replies: Unlimited
- WhatsApp auto-replies: Unlimited
- Social auto-replies: Unlimited
- Knowledge base: Editable (unlimited)
- Branded booking page: ✅
- PayPal payments: ✅
- Team members: 5
- Analytics: Full + Custom reports

---

## Trial & Early Adopter Logic

1. **Standard Trial**: 30 days of Pro tier features, no credit card required
2. **Early Adopter Trial**: 90 days of Pro tier features (first 10 signups only)
3. **Early Adopter Counter**: Atomic counter in database, checked on every signup
4. **Trial Expiry**: User prompted to upgrade or downgrade to Free tier
5. **Admin Dashboard**: Shows trial status, expiry date, conversion status, early adopter slots used

---

## API Endpoints (tRPC Procedures)

### Auth
- `auth.me` - Get current user
- `auth.logout` - Logout user
- `auth.checkTrialStatus` - Check if trial is active/expired

### Bookings
- `bookings.list` - List user's bookings (with pagination)
- `bookings.create` - Create new booking (check tier limits)
- `bookings.update` - Update booking
- `bookings.cancel` - Cancel booking
- `bookings.getPublicBookingPage` - Get branded booking page
- `bookings.submitPublicBooking` - Submit booking from public page

### Email Auto-Reply
- `email.getConversations` - List email conversations
- `email.getConversation` - Get single conversation with history
- `email.generateReply` - Generate AI reply using knowledge base
- `email.sendReply` - Send generated reply
- `email.flagForReview` - Flag conversation for human review

### WhatsApp Auto-Reply
- `whatsapp.getConversations` - List WhatsApp conversations
- `whatsapp.getConversation` - Get single conversation with history
- `whatsapp.generateReply` - Generate AI reply using knowledge base
- `whatsapp.sendReply` - Send generated reply
- `whatsapp.flagForReview` - Flag conversation for human review

### Knowledge Base
- `knowledgeBase.list` - List articles (free tier: read-only default)
- `knowledgeBase.create` - Create article (paid tiers only)
- `knowledgeBase.update` - Update article (paid tiers only)
- `knowledgeBase.delete` - Delete article (paid tiers only)
- `knowledgeBase.search` - Search articles

### Payments & Subscriptions
- `payments.getHistory` - Get payment history
- `payments.initiatePayment` - Initiate PayPal payment
- `payments.handlePaypalCallback` - Handle PayPal callback
- `payments.requestRefund` - Request refund
- `payments.getInvoice` - Get invoice PDF

### Analytics
- `analytics.getDashboard` - Get dashboard metrics
- `analytics.getBookingStats` - Get booking analytics
- `analytics.getResponseStats` - Get email/WhatsApp response stats
- `analytics.getRevenueStats` - Get revenue analytics (Pro tier only)

### Admin
- `admin.getUsersList` - List all users (admin only)
- `admin.getEarlyAdopterStatus` - Get early adopter counter status
- `admin.getUserDetails` - Get detailed user info
- `admin.updateUserTier` - Manually update user tier

---

## External Integrations

### AI/LLM
- **Provider**: OpenAI GPT-4o
- **Use**: Generate intelligent email/WhatsApp replies using knowledge base context
- **Rate Limiting**: Respect tier limits (usage tracking table)

### Email
- **Provider**: SendGrid or Nodemailer
- **Use**: Send booking confirmations, reminders, auto-reply emails, invoices

### WhatsApp
- **Provider**: Twilio or Meta Cloud API
- **Use**: Send auto-replies to WhatsApp messages

### Payments
- **Provider**: PayPal REST API
- **Use**: Process payments for bookings and subscriptions

### Calendar (Optional)
- **Provider**: Google Calendar API
- **Use**: Sync bookings with user's calendar

---

## Security Considerations

1. **Feature Flag Enforcement**: Every endpoint checks `usageTracking` and `subscriptionTier` before allowing action
2. **Rate Limiting**: Implement rate limiting on AI endpoints to prevent abuse
3. **Data Isolation**: All queries filtered by `userId` to prevent cross-user data access
4. **Payment Security**: PayPal webhook validation, PCI compliance
5. **API Key Management**: Store all external API keys in environment variables
6. **JWT Session**: Secure session cookies with HttpOnly, Secure, SameSite flags

---

## Deployment Strategy

1. **Frontend**: Vite + React 19 + Tailwind CSS 4
2. **Backend**: Express 4 + tRPC 11 + Node.js
3. **Database**: MySQL/TiDB (via Manus)
4. **Storage**: S3 (for invoices, logos, etc.)
5. **Hosting**: Manus platform with auto-scaling
6. **CI/CD**: Git-based deployment with checkpoints

---

## Build Priority Order

1. ✅ Schema design & migrations
2. Auth system + tier/trial logic
3. Core booking system + admin dashboard
4. AI email auto-reply + knowledge base CMS
5. AI WhatsApp auto-reply
6. PayPal payment integration
7. Analytics & reporting dashboard
8. Branded booking page generator
9. Automated notifications
10. Testing & optimization

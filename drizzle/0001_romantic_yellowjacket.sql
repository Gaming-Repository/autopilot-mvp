CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20),
	`status` enum('pending','confirmed','completed','cancelled','no-show') NOT NULL DEFAULT 'pending',
	`reminderSentAt` timestamp,
	`confirmationSentAt` timestamp,
	`paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentId` varchar(255),
	`amount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandedBookingPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`slug` varchar(255) NOT NULL,
	`customDomain` varchar(255),
	`logoUrl` varchar(1024),
	`primaryColor` varchar(7) NOT NULL DEFAULT '#000000',
	`secondaryColor` varchar(7) NOT NULL DEFAULT '#FFFFFF',
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandedBookingPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `brandedBookingPages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `earlyAdopterCounter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slotsUsed` int NOT NULL DEFAULT 0,
	`maxSlots` int NOT NULL DEFAULT 10,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `earlyAdopterCounter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`senderEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`messageHistory` json,
	`lastMessageAt` timestamp NOT NULL,
	`autoReplyGenerated` boolean NOT NULL DEFAULT false,
	`autoReplyContent` text,
	`flaggedForReview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`paymentId` int NOT NULL,
	`invoiceNumber` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text NOT NULL,
	`pdfUrl` varchar(1024),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`searchKeywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('booking_confirmation','booking_reminder','payment_receipt','owner_alert','new_inquiry') NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int,
	`subscriptionId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`paymentMethod` enum('paypal','stripe') NOT NULL,
	`paymentId` varchar(255) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`invoiceId` varchar(255),
	`refundId` varchar(255),
	`refundReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_paymentId_unique` UNIQUE(`paymentId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` enum('free','basic','pro') NOT NULL,
	`monthlyPrice` decimal(10,2),
	`bookingsPerMonth` int NOT NULL DEFAULT -1,
	`emailRepliesPerMonth` int NOT NULL DEFAULT -1,
	`whatsappRepliesPerMonth` int NOT NULL DEFAULT -1,
	`socialRepliesPerMonth` int NOT NULL DEFAULT -1,
	`knowledgeBaseEditable` boolean NOT NULL DEFAULT false,
	`brandedBookingPage` boolean NOT NULL DEFAULT false,
	`paypalPayments` boolean NOT NULL DEFAULT false,
	`teamMembers` int NOT NULL DEFAULT 1,
	`analyticsLevel` enum('basic','full') NOT NULL DEFAULT 'basic',
	CONSTRAINT `subscriptionTiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionTiers_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `usageTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` date NOT NULL,
	`bookingsUsed` int NOT NULL DEFAULT 0,
	`emailRepliesUsed` int NOT NULL DEFAULT 0,
	`whatsappRepliesUsed` int NOT NULL DEFAULT 0,
	`socialRepliesUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usageTracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `usageTracking_userId_month_unique` UNIQUE(`userId`,`month`)
);
--> statement-breakpoint
CREATE TABLE `whatsappConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`messageHistory` json,
	`lastMessageAt` timestamp NOT NULL,
	`autoReplyGenerated` boolean NOT NULL DEFAULT false,
	`autoReplyContent` text,
	`flaggedForReview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','basic','pro') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialStartedAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialDaysRemaining` int DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isEarlyAdopter` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialConvertedAt` timestamp;
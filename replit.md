# MY JANTES - Application de Rénovation de Jantes

## Overview

MY JANTES is a comprehensive web application for a wheel renovation business based in Liévin, France. The application provides online quote requests, invoice management, and appointment booking services for aluminum wheel renovation. It features both customer-facing functionality and admin management tools, with a modern full-stack architecture built on Node.js, React, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React-based SPA**: Modern single-page application using React with TypeScript
- **Component Library**: Radix UI components for accessible and consistent UI elements
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom utility classes and shadcn/ui components
- **File Uploads**: Uppy integration for handling file uploads with progress tracking

### Backend Architecture
- **Express.js Server**: RESTful API server with TypeScript support
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Multi-strategy authentication supporting both Replit OAuth and traditional password-based auth
- **Session Management**: Express sessions with PostgreSQL store for persistent login state
- **API Structure**: Modular route system with role-based access control (client/admin roles)

### Database Design
- **User Management**: Comprehensive user profiles with contact information, preferences, and role-based access
- **Business Entities**: Three core business models:
  - Devis (Quotes): Quote requests with status tracking and file attachments
  - Factures (Invoices): Invoice management with payment status tracking
  - Reservations (Bookings): Appointment scheduling with status management
- **Audit Trail**: Timestamps and status tracking across all entities
- **File Storage**: Integration with Google Cloud Storage for document and image management

### Authentication & Authorization
- **Dual Authentication**: Supports both Replit OAuth (for development/deployment) and traditional email/password
- **Role-Based Access**: Client and admin roles with appropriate permissions
- **Session Security**: Secure session management with PostgreSQL backing store
- **Password Security**: bcrypt hashing with configurable salt rounds

### Business Logic Architecture
- **Storage Service**: Abstracted data access layer providing consistent CRUD operations
- **Notification Service**: Email and SMS notification system using nodemailer and Twilio
- **File Management**: Google Cloud Storage integration for secure file uploads and retrieval
- **Search Functionality**: Full-text search capabilities across quotes, invoices, and bookings

## External Dependencies

### Cloud Services
- **Neon Database**: PostgreSQL hosting with serverless capabilities
- **Google Cloud Storage**: File and document storage with public/private access controls
- **Replit Authentication**: OAuth integration for seamless Replit ecosystem authentication

### Communication Services
- **SendGrid**: Email delivery service for transactional emails
- **Twilio**: SMS messaging service for customer notifications
- **Nodemailer**: Email sending with multiple provider support

### Development & Deployment
- **Replit Platform**: Primary development and hosting environment
- **Vite**: Fast build tool and development server for the React frontend
- **Drizzle Kit**: Database migration and schema management tools
- **TypeScript**: Type safety across the entire application stack

### UI & UX Libraries
- **Radix UI**: Accessible component primitives for forms, dialogs, and navigation
- **Lucide React**: Consistent icon library
- **TanStack Query**: Server state management with caching and background updates
- **Tailwind CSS**: Utility-first CSS framework for responsive design
# MASTER PROMPT — COMPLETE FRONTEND DEVELOPMENT
## QR-Based Multi-Shop Printing Management SaaS Platform

### ROLE & RESPONSIBILITY

Act as a Senior Full-Stack Frontend Engineer, SaaS Product Architect, UI/UX Designer, and Quality Assurance Engineer.

Your responsibility is to analyze, design, develop, and deliver a complete, professional, fully functional frontend for a QR-Based Multi-Shop Printing Management Platform.

This is a multi-tenant SaaS web application designed to connect independent printing shops with their customers through shop-specific QR codes.

Do not treat this project as a simple landing page, static dashboard, or UI prototype.

Build a complete frontend application with functional navigation, interactive components, realistic workflows, form validation, data management, and persistent demonstration data.

Follow every requirement below carefully.

---

# 1. PRIMARY PRODUCT OBJECTIVE

Build one centralized platform where:

- One Super Admin manages the entire platform.
- Multiple independent printing shops operate under the same platform.
- Every shop has its own Shop Admin account and independent dashboard.
- Each shop manages its own services, prices, QR codes, customer orders, documents, and printing operations.
- Customers scan a shop-specific QR code, upload documents, select printing preferences, review estimated charges, and submit printing requests.
- Shop administrators receive, review, approve, reject, and process customer printing requests.

The application must be designed around three primary user experiences:

1. Super Admin Panel.
2. Shop Admin Panel.
3. Customer-Facing QR Printing Portal.

All three experiences must work together as one coherent application.

---

# 2. IMPORTANT DEVELOPMENT RULES

Before development:

1. Inspect the existing project structure and source files.
2. Identify the existing framework, dependencies, routing system, and current implementation.
3. Reuse the existing technology stack whenever possible.
4. Do not unnecessarily replace working configurations.
5. Do not remove existing functional features without a valid reason.
6. Do not create duplicate pages or redundant components.
7. Organize the application into reusable, maintainable components.
8. Implement proper routing and role-based navigation.
9. Make all important interactions functional.
10. Do not leave placeholder buttons or dead navigation links.

### Frontend Development Scope

For this initial development phase:

- Complete the frontend functionality.
- Use realistic mock data where backend services are not available.
- Use localStorage for persistent demonstration data.
- Keep the application architecture ready for future backend/API integration.
- Separate business logic from UI components.
- Use service/helper layers for data operations.
- Do not expose secrets or implement fake security claims.
- Clearly distinguish simulated integrations from real integrations.

Do not build a fake backend or claim that external services are connected when they are not.

---

# 3. DESIGN SYSTEM & VISUAL DIRECTION

Create a modern, simple, creative, aesthetic, and professional SaaS interface.

The design should communicate reliability, productivity, and trust.

### Design Principles

- Minimal but visually attractive.
- Clean layouts with proper spacing.
- Professional typography.
- Consistent iconography.
- Balanced use of colors.
- Beautiful cards and tables.
- Subtle shadows and borders.
- Smooth transitions and micro-interactions.
- Clear visual hierarchy.
- Consistent component styling.
- Excellent readability.
- No unnecessary decorative elements.

### Theme Support

Implement:

- Light mode.
- Dark mode.
- Theme switching.
- Persistent theme preference.
- Consistent colors across every module.

Light mode must be genuinely readable and professionally designed, not simply a white background.

### Layout Requirements

For administrative dashboards:

- Professional collapsible sidebar.
- Clean top navigation.
- Page title and contextual actions.
- Breadcrumbs where useful.
- Dashboard summary cards.
- Responsive tables.
- Search and filter controls.
- Proper dropdown menus.
- Confirmation dialogs.
- Toast notifications.
- Empty states.
- Loading states.
- Error states.
- Success states.

Avoid oversized modals, cluttered layouts, excessive gradients, unnecessary animations, and inconsistent spacing.

### Responsive Requirements

Customer interface:
- Mobile-first design.
- Android and iPhone compatibility.
- Tablet support.
- Desktop support.

Administrative interfaces:
- Optimized for desktop and laptop.
- Responsive tablet layouts.
- Usable mobile layouts.
- Properly adapted tables, menus, dialogs, and sidebars.

No horizontal overflow, broken cards, overlapping text, or inaccessible buttons.

---

# 4. APPLICATION STRUCTURE & USER ROLES

## A. SUPER ADMIN PANEL

The Super Admin is the central platform owner.

Build a dedicated Super Admin authentication page and dashboard.

### 4.1 Super Admin Dashboard

Display summary cards for:

- Total Registered Shops.
- Active Shops.
- Suspended Shops.
- Deactivated Shops.
- Total Printing Orders.
- Pending Orders.
- Completed Orders.
- Platform Revenue, where applicable.
- Active Subscriptions.
- Expiring Subscriptions.

Include:

- Platform activity chart.
- Order statistics.
- Shop registration trends.
- Recent shop registrations.
- Recent platform activities.
- Important notifications.
- Quick action shortcuts.

Use realistic demonstration data.

### 4.2 Shop Management

Create a complete Shop Management module.

Features:

- View all registered shops.
- Create new shop.
- Edit shop information.
- View shop details.
- Search shops.
- Filter shops.
- Sort records.
- Activate shops.
- Suspend shops.
- Deactivate shops.
- Reactivate eligible shops.
- View shop activity.
- View subscription status.
- Manage shop administrator credentials.
- Reset administrator credentials.

### Create Shop Form

Include:

- Shop Name.
- Owner Name.
- Contact Number.
- Email Address (optional where unavailable).
- Shop Address.
- City.
- Account Status.
- Subscription Assignment.

On creation:

- Generate a unique Shop ID.
- Create the associated shop administrator account.
- Associate the account with the correct Shop ID.
- Display the generated credentials through a secure administrative confirmation interface.
- Never display or store real plaintext passwords in production.

Example Shop IDs:

SHOP-1001
SHOP-1002
SHOP-1003

Use a realistic demonstration authentication system for the frontend.

### 4.3 Shop Details

Create a detailed shop profile page containing:

- Shop information.
- Owner information.
- Shop ID.
- Account status.
- Administrator information.
- Total orders.
- Completed orders.
- Pending orders.
- Registration date.
- Subscription details.
- Shop activity history.

### 4.4 Subscription Management

Prepare the frontend structure for future subscription functionality.

Include:

- Subscription plans.
- Plan name.
- Subscription price.
- Billing period.
- Plan description.
- Assign plan to shop.
- Subscription start date.
- Expiry date.
- Subscription status.
- Subscription payment history.

Allow Super Admin to create, edit, and manage demonstration subscription plans.

The actual commercial pricing and payment rules are not yet finalized. Do not invent mandatory business policies.

### 4.5 Platform Reports

Create reporting screens for:

- Shop registrations.
- Shop activity.
- Printing orders.
- Completed orders.
- Subscription records.
- Platform revenue.
- Account statuses.

Include appropriate date filters, search, charts, summary cards, and export UI where feasible.

### 4.6 Platform Settings

Include:

- Platform profile.
- General settings.
- Appearance settings.
- Notification preferences.
- Account settings.
- Support management.

---

# 5. SHOP ADMIN PANEL

Every registered printing shop must have its own independent Shop Admin dashboard.

### CRITICAL MULTI-TENANT RULE

A Shop Admin must only access information belonging to their own shop.

For frontend demonstration:

- Associate every shop-related record with a Shop ID.
- Use the authenticated demonstration user's Shop ID to filter data.
- Do not use one shared unfiltered data view for every shop.
- Changing routes or URL parameters must not allow a user to view another shop's data.
- Keep tenant authorization boundaries explicit so they can be enforced server-side in the backend phase.

Create separate demonstration accounts for multiple shops to test tenant isolation.

## 5.1 Shop Admin Dashboard

Display:

- Total Orders.
- New Orders.
- Pending Orders.
- Approved Orders.
- Printing In Progress.
- Completed Orders.
- Rejected Orders.
- Cancelled Orders.
- Today's Orders.
- Estimated Sales/Revenue.

Include:

- Order activity chart.
- Order status chart.
- Recent orders.
- Recent activities.
- New order notifications.
- Quick actions.

All dashboard statistics must reflect the currently authenticated shop's data.

## 5.2 Shop Profile Management

Allow Shop Admin to:

- View shop information.
- Edit shop name.
- Update owner name.
- Update contact number.
- Update email.
- Update address.
- Update city.
- View Shop ID.
- View account status.

Do not allow Shop Admin to change platform-level ownership or another shop's information.

## 5.3 Printing Services Management

Create a complete Printing Services module.

Allow Shop Admin to:

- Add printing services.
- Edit services.
- Delete services.
- Activate/deactivate services.
- Create service categories.
- Edit categories.
- Configure supported paper sizes.
- Configure printing types.
- Configure additional printing options.

Support:

- Black & White Printing.
- Colour Printing.
- A4 Paper.
- A3 Paper.
- Other configurable paper sizes.
- Single-Sided Printing.
- Double-Sided Printing.
- Photocopy Services.
- Other shop-defined services.

Only enabled services should appear in the customer portal.

## 5.4 Pricing Management

Create a dedicated pricing configuration interface.

Example:

Shop A:

- A4 Black & White: PKR 5.
- A4 Colour: PKR 25.
- A3 Black & White: PKR 15.
- A3 Colour: PKR 50.

Shop B:

- A4 Black & White: PKR 7.
- A4 Colour: PKR 30.
- A3 Black & White: PKR 20.
- A3 Colour: PKR 60.

These prices are examples only.

Requirements:

- Add new prices.
- Edit prices.
- Increase or decrease prices.
- Deactivate services.
- Configure additional charges.
- View current pricing.
- View pricing history.
- Display price effective dates where appropriate.

Important:

Previously submitted orders must retain their original agreed prices.

Changing current prices must not modify existing order totals.

## 5.5 QR CODE MANAGEMENT — CORE FEATURE

This is one of the most important modules of the application.

Create a complete and professional QR Code Management interface.

### QR Code Dashboard

Display:

- Active QR Code.
- QR Code Identifier.
- Creation Date.
- QR Status.
- Last Replacement Information.
- QR Code History.

### Generate QR Code

Provide a Generate QR Code action.

When triggered:

- Generate a unique demonstration QR identity.
- Associate it with the currently authenticated Shop ID.
- Generate a customer-facing shop URL.
- Display the generated QR code visually.
- Show the shop name.
- Show the QR identifier.
- Display scanning instructions.

Use a proper QR-code generation library if available.

Do not use a decorative fake QR image that cannot be scanned.

### QR Code Download

Support:

- PNG download.
- Printable PDF download.
- High-resolution QR output.
- Print-friendly QR poster.
- Shop name on the poster.
- Simple customer scanning instructions.

The QR code must contain the actual shop-specific customer portal URL.

### QR Code Reprinting

Allow the shop owner to download the same active QR code again.

Important:

Reprinting an existing QR code must not generate a new QR identity.

### QR Code Revocation

Implement this exact workflow:

1. Select an active QR code.
2. Click Revoke QR Code.
3. Display a confirmation dialog.
4. Explain that new requests through this QR code will be blocked.
5. Require confirmation.
6. Change its status to Revoked.
7. Record revocation date and time.
8. Update the QR history.

A revoked QR code must never become active again.

### QR Code Replacement

After revocation:

- Show Generate Replacement QR Code.
- Generate a new unique identifier or token.
- Associate the replacement with the same Shop ID.
- Preserve the existing shop profile.
- Preserve existing orders.
- Preserve pricing.
- Add the replacement to QR history.
- Allow downloading the new QR code.

Revoking a QR code must never deactivate the entire shop.

### QR Code History

Display:

- QR Code ID.
- Creation Date.
- Status.
- Revocation Date.
- Replacement Reference.
- Related Shop.

Provide search and status filters.

---

# 6. CUSTOMER-FACING QR PRINTING PORTAL

Create a dedicated customer interface.

Customers do not need an account for the initial MVP.

The customer must access the correct shop through its active QR code.

## 6.1 Shop Identification

When a customer scans a shop QR code:

- Open the customer-facing webpage.
- Identify the correct shop.
- Display the shop name.
- Display relevant shop information.
- Load that shop's enabled printing services.
- Load that shop's current prices.

If the QR code is revoked or invalid:

Display a clear, professional error screen explaining that the QR code is no longer active and instructing the customer to obtain the current QR code from the shop.

Do not show another shop's information.

## 6.2 Customer Upload Interface

Create an intuitive mobile-first upload page.

Support these file formats:

- PDF.
- JPG.
- JPEG.
- PNG.
- Supported Microsoft Word documents, subject to processing compatibility.

Features:

- Multiple file uploads.
- Mobile file picker.
- Display uploaded filenames.
- Display file sizes.
- Display upload progress.
- Remove uploaded files.
- Validate file extensions and MIME types.
- Configurable file-size limits.
- Display upload errors.
- Prevent unsupported files.
- Show selected document information.

Do not silently accept invalid files.

Where document parsing is unavailable in frontend-only mode, clearly distinguish estimated or simulated page counts from verified page counts.

## 6.3 Printing Preferences

Allow customers to configure each document or printing job using the shop's available options.

Options:

- Black & White.
- Colour.
- A4.
- A3.
- Other enabled paper sizes.
- Single-Sided.
- Double-Sided.
- Number of Copies.
- All Pages.
- Selected Page Ranges.

Only display options supported by the selected shop.

Provide clear controls with understandable labels.

## 6.4 Price Estimation

Build a dynamic price calculation system.

Example:

- 10 pages.
- Black & White.
- PKR 5 per page.
- 2 copies.

Estimated Total: PKR 100.

Calculation must consider:

- Number of printable pages.
- Number of copies.
- Printing type.
- Paper size.
- Single-sided or double-sided configuration.
- Additional configured charges.

Use the selected shop's pricing.

Show:

- Selected files.
- Page count.
- Printing preferences.
- Copies.
- Price breakdown.
- Estimated total in PKR.

Clearly label the total as an estimate until the shop verifies the request.

Prevent invalid quantities, negative values, and invalid page ranges.

## 6.5 Order Review & Submission

Before submission, show a complete order review screen.

Include:

- Shop Name.
- Uploaded Documents.
- Printing Preferences.
- Number of Copies.
- Estimated Charges.
- Payment Method, where configured.
- Customer Reference Information if required by the shop's workflow.

Allow the customer to edit their selections.

On submission:

- Generate a unique Order ID.
- Associate the order with the correct Shop ID.
- Save document references and printing preferences.
- Save a snapshot of the current prices.
- Save the estimated total.
- Set the initial order status.
- Display a successful order confirmation screen.

Prevent accidental duplicate submissions.

## 6.6 Customer Order Confirmation

After submission, display:

- Success message.
- Order ID.
- Shop Name.
- Submitted Documents.
- Estimated Charges.
- Current Order Status.
- Submission Date and Time.
- Next-step instructions.

Provide an order tracking interface where supported.

Customers should be able to check their order status using a secure order reference or tracking mechanism without creating an account.

Do not expose private document URLs through public tracking pages.

---

# 7. SHOP ORDER MANAGEMENT

Create a complete order management system.

### Order Categories / Status Tabs

- New Orders.
- Pending Orders.
- Approved Orders.
- Rejected Orders.
- Printing In Progress.
- Completed Orders.
- Cancelled Orders.
- Printing Failed.

### Orders Table

Display:

- Order ID.
- Customer Reference.
- Submission Time.
- Documents Count.
- Printing Type.
- Copies.
- Estimated Total.
- Payment Status.
- Order Status.
- Actions.

Add:

- Search by Order ID.
- Search customer reference.
- Date filters.
- Status filters.
- Sorting.
- Pagination.
- Responsive table behavior.

### Order Details

Clicking an order must open a detailed order view.

Show:

- Order ID.
- Shop ID.
- Customer information/reference.
- Documents.
- File information.
- Printing preferences.
- Page count.
- Number of copies.
- Estimated charges.
- Final charges.
- Payment information.
- Submission timestamp.
- Approval/rejection information.
- Printing status history.

## 7.1 Document Review

Shop Admin must be able to:

- View uploaded document details.
- Preview supported PDF documents.
- Preview supported images.
- Open document information.
- Verify page count where available.
- Review printing preferences.
- Review estimated charges.
- Download authorized documents.
- Approve the order.
- Reject the order.
- Provide a rejection reason.

When a document cannot be previewed, show a clear fallback with authorized download access.

## 7.2 Approval & Rejection

Approval workflow:

1. Shop Admin opens an incoming order.
2. Reviews documents.
3. Verifies preferences.
4. Checks estimated charges.
5. Adjusts final charges if necessary.
6. Approves the request.
7. Records approval time.
8. Updates order status.

Rejection workflow:

1. Shop Admin opens an incoming order.
2. Selects Reject.
3. Enters a rejection reason.
4. Confirms rejection.
5. Records rejection time.
6. Updates order status.
7. Displays the relevant update to the customer.

Rejected orders must never enter the printing process.

## 7.3 Printing Workflow

Implement the complete printing status interface.

Statuses:

- Approved.
- Printing Initiated.
- Printing In Progress.
- Printing Completed.
- Printing Failed.
- Completed and Handed Over.

Allow the Shop Admin to:

- Initiate printing.
- Open approved documents.
- Use browser-supported printing where appropriate.
- Update printing status.
- Mark printing as failed.
- Record failure reasons.
- Retry or manually recover a failed printing job.
- Mark the order completed.
- Confirm handover.

Important technical distinction:

Real automatic printer communication requires a compatible printer integration or local printing agent.

In frontend-only mode, implement the complete operational interface and browser printing where supported, but clearly label simulated printer monitoring and do not falsely report that a physical printer has completed a job.

---

# 8. DOCUMENT MANAGEMENT

Create a dedicated Document Management section.

Features:

- View uploaded documents.
- Search documents.
- Filter by order.
- Filter by date.
- Filter by file type.
- View file details.
- Download authorized documents.
- Track document association with orders.
- Display document retention information where configured.

Ensure document access follows the current shop context.

Do not expose another shop's documents.

---

# 9. PRINTER CONFIGURATION

Create a Printer Configuration module.

Include:

- Printer name.
- Printer model.
- Printer type.
- Connection status.
- Default printer.
- Supported paper sizes.
- Printing capabilities.
- Configuration details.
- Add printer interface.
- Edit printer interface.
- Remove printer interface.
- Test connection interface where technically supported.

Provide a clear distinction between configured printers and actually connected printers.

Do not fabricate successful physical printer connections.

---

# 10. ORDER HISTORY

Create a dedicated historical order module.

Features:

- View all historical orders belonging to the current shop.
- Search by Order ID.
- Filter by date.
- Filter by status.
- View customer reference.
- View order totals.
- View printing status.
- View rejection records.
- View cancelled orders.
- Open historical order details.

Previously submitted order prices must remain unchanged even after current pricing is updated.

---

# 11. PAYMENT MANAGEMENT

Build a flexible payment interface.

Supported payment method options:

- Cash at Shop.
- JazzCash.
- Easypaisa.
- Online Payment Gateway.
- Other shop-configured methods.

Allow the shop to enable or disable supported payment options.

Payment statuses:

- Payment Pending.
- Payment Submitted.
- Payment Verified.
- Payment Failed.
- Refunded.

Display payment information within order details.

Include a payment verification interface for authorized shop administrators.

A customer-uploaded payment screenshot must never automatically change payment status to Verified.

Actual gateway processing, transaction verification, and refunds require backend/provider integration. In frontend-only mode, provide realistic demonstration workflows and clearly label simulated transactions.

Do not assume whether payments are collected centrally or directly by individual shops. Keep the interface flexible.

---

# 12. NOTIFICATION SYSTEM

Implement an in-app notification center.

### Customer Notifications

- Document Upload Successful.
- Order Submitted.
- Order Approved.
- Order Rejected.
- Printing Started.
- Order Completed.
- Payment Status Updated.

### Shop Admin Notifications

- New Printing Request.
- New Customer Order.
- Payment Update.
- Pending Order Reminder.
- Printing Failure, where detectable.

### Super Admin Notifications

- New Shop Registration.
- Subscription Expiry.
- Shop Activation.
- Shop Suspension.
- Important Platform Errors.

Include:

- Notification dropdown.
- Notification list.
- Unread count.
- Read/unread states.
- Mark as read.
- Mark all as read.
- Notification timestamps.

Use local demonstration notifications where real-time services are not available.

Prepare the structure for future email and messaging integrations.

---

# 13. SECURITY & PRIVACY INTERFACE REQUIREMENTS

Security must be considered throughout the application.

Implement frontend-facing security workflows and interfaces for:

- Role-based navigation.
- Protected application routes.
- Shop-specific data filtering.
- Secure login forms.
- Password visibility controls.
- Password reset interface.
- Session/logout interface.
- QR code status validation.
- File validation.
- Confirmation dialogs for sensitive actions.
- Audit log views.
- Document retention settings.
- Account activation and suspension states.

Important:

Frontend route protection and localStorage are not real security boundaries.

Real authentication, tenant authorization, secure private storage, malware scanning, protected file delivery, audit integrity, and server-side validation must be implemented in the backend phase.

Do not present frontend-only security as production-grade security.

---

# 14. AUDIT LOGS & ACTIVITY HISTORY

Create appropriate activity records for:

- Shop creation.
- Shop information updates.
- Shop activation.
- Shop suspension.
- Credential reset events.
- Pricing changes.
- QR generation.
- QR revocation.
- QR replacement.
- Order approval.
- Order rejection.
- Printing status updates.
- Payment status changes.

Display:

- Action.
- User/administrator.
- Related Shop ID.
- Related Order ID where applicable.
- Timestamp.
- Relevant details.

Super Admin should have platform-level audit visibility.

Shop Admin should only see authorized shop-level activities.

---

# 15. REPORTS & ANALYTICS

### Shop Reports

Include:

- Daily Orders.
- Weekly Orders.
- Monthly Orders.
- Completed Orders.
- Pending Orders.
- Rejected Orders.
- Printing Revenue.
- Payment Status.
- Most Used Printing Services.
- Order Processing Trends.

### Super Admin Reports

Include:

- Total Shops.
- Active Shops.
- Suspended Shops.
- New Registrations.
- Total Platform Orders.
- Shop Activity.
- Subscription Statistics.
- Platform Revenue where applicable.

Use clear charts and date filters.

All reports must use the correct scope of data.

---

# 16. SETTINGS & SUPPORT

### Shop Account Settings

Include:

- Account Information.
- Password Management.
- Shop Preferences.
- Notification Preferences.
- Theme Preferences.
- Language Preferences.
- Session Logout.

### Platform Support

Create:

- Support Dashboard.
- Support Requests.
- Ticket Details.
- Ticket Status.
- Support History.
- Help and FAQ interface.

Only implement features consistent with the existing PRD and the initial platform scope.

---

# 17. AUTHENTICATION & ROLE-BASED NAVIGATION

Build separate, coherent login experiences for:

1. Super Admin.
2. Shop Admin.

Authentication must determine the user's role and associated Shop ID.

After login:

- Super Admin → Super Admin Dashboard.
- Shop Admin → Their own Shop Dashboard.

Provide:

- Login form.
- Username/email field as appropriate to the configured account.
- Password field.
- Show/hide password.
- Remember-me UI if supported by the session implementation.
- Forgot-password interface.
- Validation errors.
- Loading state.
- Logout.

For demonstration purposes, create clearly identified test accounts for Super Admin and multiple Shop Admins.

Do not require customer account registration for the initial MVP.

Customer access must be based on the shop-specific QR route.

Do not expose administrative pages to customer routes.

---

# 18. CUSTOMER ORDER TRACKING

Create a simple, mobile-friendly tracking page.

Show a visual order timeline:

1. Order Submitted.
2. Awaiting Shop Review.
3. Approved or Rejected.
4. Printing Initiated.
5. Printing In Progress.
6. Printing Completed.
7. Ready for Collection.
8. Handed Over / Completed.

Only show statuses relevant to the actual order.

Display rejection reasons where applicable.

Display payment status separately from printing status.

---

# 19. FRONTEND DATA MANAGEMENT

Use localStorage for the frontend demonstration.

Organize the demonstration data into logical entities:

- Users.
- Roles.
- Shops.
- Shop Profiles.
- Shop Settings.
- Printing Services.
- Service Categories.
- Pricing.
- Pricing History.
- QR Codes.
- QR Code History.
- Customer Orders.
- Documents and Document Metadata.
- Printers.
- Payments.
- Subscriptions.
- Notifications.
- Audit Logs.

### Data Rules

- Every shop has a unique Shop ID.
- Every shop-related record must reference its correct Shop ID.
- Orders must retain their original price snapshots.
- QR history must be preserved.
- Revoked QR identities must remain revoked.
- New replacement QR identities must be unique.
- Existing orders must not disappear when a QR code is replaced.
- Changing one shop's pricing must not affect another shop.
- Each user must only see the data permitted by their role.
- Data must persist after refreshing the browser.

Provide a clearly labeled demonstration-data reset function for development/testing.

Avoid accidental data deletion.

Use confirmation dialogs for destructive operations.

---

# 20. ERROR HANDLING & EMPTY STATES

Every important module must include:

- Loading states.
- Empty states.
- Validation messages.
- Error messages.
- Success messages.
- Confirmation dialogs.
- Retry actions where appropriate.

Examples:

- No shops registered.
- No incoming orders.
- No active QR code.
- QR code revoked.
- Invalid QR code.
- Unsupported document format.
- File too large.
- Upload failed.
- Invalid page range.
- Pricing unavailable.
- Order submission failed.
- Printer unavailable.
- Printing failed.
- Payment verification pending.
- Unauthorized access.
- Shop account suspended.

Error messages must be understandable to ordinary users.

---

# 21. MVP PRIORITY & FUTURE FEATURES

The initial implementation must prioritize the actual MVP requirements.

### MUST BE IMPLEMENTED NOW

Super Admin:
- Login.
- Dashboard.
- Shop creation.
- Shop management.
- Shop administrator credentials.
- Activation and suspension.
- Basic reports.

Shop Admin:
- Login.
- Independent dashboard.
- Shop profile.
- Printing services.
- Pricing management.
- QR generation.
- QR download.
- QR reprinting.
- QR revocation.
- QR replacement.
- Order management.
- Document review.
- Approval/rejection.
- Printing workflow interface.
- Order history.

Customer:
- QR access.
- Shop identification.
- Document upload.
- Printing preferences.
- Price estimation.
- Order submission.
- Confirmation.
- Order tracking.

Platform:
- Multi-tenant data organization.
- Document handling interface.
- Basic notifications.
- Audit logs.
- Persistent demonstration data.

### PREPARE FOR FUTURE RELEASES

Do not allow these features to delay the initial MVP:

- Dedicated customer mobile applications.
- Advanced printer automation.
- Multiple counter management.
- Advanced analytics.
- Loyalty and reward programs.
- Promotional discounts.
- Customer accounts and saved documents.
- Multiple staff accounts per shop.
- Advanced subscription billing.
- Multi-country tax configurations.
- Franchise and printing-chain management.
- AI-based document processing.

You may prepare extensible architecture for these features, but do not invent unnecessary workflows or build them as mandatory MVP functionality.

---

# 22. TECHNICAL QUALITY REQUIREMENTS

The application must have:

- Clean and reusable component architecture.
- Consistent routing.
- Proper state management.
- Centralized data helpers.
- Form validation.
- Reusable modal components.
- Reusable table components.
- Reusable status badges.
- Reusable notification components.
- Responsive layouts.
- Maintainable code.
- Proper error handling.
- No unnecessary dependencies.
- No broken imports.
- No console errors.
- No duplicate component implementations.
- No dead buttons.
- No unfinished navigation.
- No inconsistent UI.

Use appropriate libraries for QR code generation, charts, icons, and document preview where compatible with the existing project.

Do not introduce unnecessary libraries if the existing project already has suitable dependencies.

---

# 23. QUALITY ASSURANCE & FUNCTIONAL TESTING

Before considering development complete, test the following scenarios.

### Test 1 — Multi-Shop Isolation

- Create Shop A.
- Create Shop B.
- Log into Shop A.
- Verify Shop A sees only its own data.
- Log into Shop B.
- Verify Shop B sees only its own data.
- Verify one shop cannot access another shop's orders or documents through frontend routes.

### Test 2 — Shop Registration

- Super Admin creates a shop.
- Unique Shop ID is generated.
- Shop Admin account is created.
- Shop appears in the Super Admin list.
- Shop status is reflected correctly.

### Test 3 — QR Code Lifecycle

- Generate QR code.
- Download QR code.
- Reprint the same QR code.
- Verify its identity remains unchanged.
- Revoke QR code.
- Verify revoked QR cannot accept new requests.
- Generate replacement QR.
- Verify new identity.
- Verify existing orders and prices remain unchanged.

### Test 4 — Customer Printing Request

- Scan/open an active shop QR route.
- Verify correct shop identity.
- Upload supported files.
- Configure printing options.
- Select copies.
- Verify price calculation.
- Submit the order.
- Verify unique Order ID.
- Verify correct Shop ID association.
- Verify order appears in the correct shop dashboard.

### Test 5 — Document Review

- Shop Admin opens an order.
- Reviews documents.
- Approves an order.
- Verifies the order enters the printing workflow.
- Rejects another order with a reason.
- Verifies the rejected order cannot enter printing.

### Test 6 — Printing Workflow

- Initiate printing.
- Update printing status.
- Simulate printing failure.
- Record failure reason.
- Recover the job.
- Mark printing completed.
- Mark handover completed.

### Test 7 — Pricing

- Change Shop A pricing.
- Verify Shop B pricing is unchanged.
- Verify new customer orders use updated prices.
- Verify previously submitted orders retain their original pricing.

### Test 8 — Persistence

- Create records.
- Refresh the browser.
- Verify valid demonstration data persists.
- Verify QR history and order history remain intact.

### Test 9 — Responsive Testing

Test:

- Small Android screen.
- Large Android screen.
- iPhone screen.
- Tablet.
- Laptop.
- Desktop.

Verify that all important actions remain accessible and the interface does not break.

---

# 24. FINAL DELIVERY REQUIREMENTS

Do not stop after building the dashboard.

Deliver a complete, navigable, interactive frontend for the entire MVP.

The final application must include:

1. Super Admin login and dashboard.
2. Shop Admin login and independent dashboard.
3. Shop management.
4. Shop profile management.
5. Printing services management.
6. Pricing management.
7. QR code management.
8. QR generation, download, reprinting, revocation, and replacement.
9. Customer-facing QR portal.
10. Document uploading interface.
11. Printing preference selection.
12. Dynamic price calculation.
13. Customer order submission.
14. Order confirmation.
15. Order tracking.
16. Incoming order management.
17. Document review and preview.
18. Order approval and rejection.
19. Printing workflow.
20. Document management.
21. Printer configuration.
22. Order history.
23. Payment management interface.
24. Notifications.
25. Audit logs.
26. Reports and analytics.
27. Subscription management interface.
28. Account settings.
29. Support interface.
30. Light and dark themes.
31. Fully responsive layouts.

### FINAL DEVELOPMENT INSTRUCTIONS

Work systematically.

First inspect the existing codebase.

Then establish the application architecture and design system.

Implement the complete user flows in logical stages.

After each stage, verify that existing functionality still works.

Do not deliver disconnected screens.

Do not leave core workflows as non-functional mockups.

Where a feature genuinely requires backend or hardware integration, implement the complete frontend interface and an honest demonstration workflow, and clearly document the integration requirement.

Do not claim that a simulated action is a real external transaction, secure backend operation, or physical printer operation.

Finally, run a complete functional review and fix all issues found.

### DEFINITION OF DONE

The project is complete only when:

- All three user experiences are implemented.
- All MVP screens are connected through working navigation.
- Core workflows operate correctly.
- QR lifecycle works in the demonstration environment.
- Multi-shop data separation is demonstrated.
- Pricing calculations work correctly.
- Orders can be submitted, reviewed, approved, rejected, and processed through the printing workflow.
- Existing orders retain their original pricing.
- Data persists after browser refresh.
- Responsive layouts work across mobile, tablet, and desktop.
- Light and dark modes work consistently.
- No important buttons are inactive.
- No critical console or build errors remain.
- Backend and hardware integration limitations are documented.

**Final Goal: Build a production-minded, professionally designed frontend for a complete QR-Based Multi-Shop Printing Management SaaS Platform, faithfully following the provided PRD without removing, overlooking, or unnecessarily changing its required functionality.**
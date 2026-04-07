# badekshop - Flow Diagrams

This document contains visual flow diagrams for the badekshop platform using Mermaid syntax.

---

## Table of Contents

1. [User Purchase Flow](#1-user-purchase-flow)
2. [Order Status Flow](#2-order-status-flow)
3. [KYC Status Flow](#3-kyc-status-flow)
4. [Payment Flow](#4-payment-flow)
5. [Admin KYC Approval Flow](#5-admin-kyc-approval-flow)
6. [Database ERD](#6-database-erd)

---

## 1. User Purchase Flow

```mermaid
flowchart TD
    Start([User Visits Website]) --> Landing[Landing Page]
    Landing --> Browse[Browse Products]
    Browse --> Select{Select Package}
    Select -->|eSIM| eSIMForm[Checkout Form]
    Select -->|SIM Card| SIMForm[Checkout Form]
    
    eSIMForm --> FillForm[Fill: Name, Email, Phone,<br/>Nationality, Arrival Date,<br/>Flight Number, IMEI]
    SIMForm --> FillForm
    
    FillForm --> Payment[Redirect to Midtrans]
    Payment --> PaymentCheck{Payment Status}
    
    PaymentCheck -->|Success| OrderSuccess[Order Created<br/>Payment Status: Paid]
    PaymentCheck -->|Failed| PaymentRetry{Retry?}
    
    PaymentRetry -->|Yes (Max 3)| Payment
    PaymentRetry -->|No / Expired| OrderExpired[Order Expired<br/>2-hour window]
    OrderExpired --> End1([End])
    
    OrderSuccess --> KYCForm[KYC Upload Form]
    KYCForm --> UploadDoc[Upload Passport + IMEI]
    UploadDoc --> PhotoCheck{Photo Quality}
    
    PhotoCheck -->|Clear| AutoApprove[KYC Auto-Approved]
    PhotoCheck -->|Blurry| RetryCheck{Attempt Count}
    
    RetryCheck -->|1st| Retry1[Show Retry 1 Message<br/>Educational guidance]
    RetryCheck -->|2nd| Retry2[Show Retry 2 Message<br/>Manual review pending]
    RetryCheck -->|3rd| UnderReview[KYC Under Review]
    
    Retry1 --> UploadDoc
    Retry2 --> UploadDoc
    
    UnderReview --> ManualReview{Admin Review}
    ManualReview -->|Approve| AutoApprove
    ManualReview -->|Reject| KYCRejected[KYC Rejected]
    
    AutoApprove --> QRCode[Generate QR Code]
    QRCode --> SendEmail[Send KYC Approved Email<br/>with QR Code]
    
    KYCRejected --> RefundProcess[Trigger Refund]
    RefundProcess --> End2([End])
    
    SendEmail --> Arrival{User Arrives}
    Arrival -->|24h Before| Reminder[Send Pickup Reminder]
    Reminder --> ShowQR[Show QR at Airport]
    
    Arrival -->|Direct| ShowQR
    ShowQR --> Verify[Staff Verifies Identity]
    Verify --> Handover[Hand Over SIM Card]
    Handover --> Complete[Order Completed]
    Complete --> FollowUp[Send Follow-up Email<br/>Review Invitation]
    FollowUp --> End3([End])
```

### Flow Description

| Step | Action | System Response |
|------|--------|----------------|
| 1-3 | User browses and selects package | Show product details |
| 4 | Fill checkout form | Validate inputs |
| 5 | Payment via Midtrans | 2-hour payment window |
| 6 | KYC upload | Auto-approval or retry |
| 7 | QR code generation | Email sent to customer |
| 8 | Airport pickup | Staff verification |
| 9 | Completion | Follow-up email |

---

## 2. Order Status Flow

```mermaid
stateDiagram-v2
    [*] --> pending: Create Order
    
    pending --> paid: Payment Success
    pending --> expired: Payment Timeout (2h)
    pending --> cancelled: User Cancel
    
    paid --> processing: KYC Submitted
    paid --> expired: KYC Timeout
    
    processing --> approved: KYC Approved
    processing --> rejected: KYC Rejected
    
    approved --> completed: SIM Handover
    approved --> cancelled: No Show
    
    rejected --> cancelled: Auto-cancel
    rejected --> refund: Refund Processed
    
    expired --> [*]: End
    cancelled --> [*]: End
    completed --> [*]: End
    refund --> [*]: End
    
    note right of pending
        Order created
        2-hour payment window
    end note
    
    note right of paid
        Payment confirmed
        Awaiting KYC upload
    end note
    
    note right of processing
        KYC uploaded
        Under review
    end note
    
    note right of approved
        KYC approved
        QR code sent
        Ready for pickup
    end note
```

### Status Definitions

| Status | Description | Next Possible |
|--------|-------------|---------------|
| `pending` | Order created, awaiting payment | paid, expired, cancelled |
| `paid` | Payment successful, awaiting KYC | processing, expired |
| `processing` | KYC uploaded, under review | approved, rejected |
| `approved` | KYC approved, ready for pickup | completed, cancelled |
| `rejected` | KYC rejected, refund pending | cancelled, refund |
| `completed` | SIM handed over, order done | - |
| `cancelled` | Order cancelled | - |
| `expired` | Payment/KYC timeout | - |

---

## 3. KYC Status Flow

```mermaid
flowchart LR
    subgraph AutoFlow [Auto-Approval Flow]
        A[KYC Pending] -->|Upload| B{Photo Quality}
        B -->|Clear| C[Auto-Approved]
        C --> D[Order: Processing]
    end
    
    subgraph RetryFlow [Retry Flow]
        B -->|Blurry| E{Attempt 1}
        E -->|Yes| F[Retry 1 Status]
        F -->|Message| G["Try again in<br/>brighter area"]
        G -->|Upload| B
        
        E -->|No| H{Attempt 2}
        H -->|Yes| I[Retry 2 Status]
        I -->|Message| J["Manual review<br/>will check"]
        J -->|Upload| B
    end
    
    subgraph ManualFlow [Manual Review Flow]
        H -->|No| K[Under Review]
        K -->|Admin| L{Review}
        L -->|Approve| M[Approved]
        L -->|Reject| N[Rejected]
        
        M --> D
        N --> O[Trigger Refund]
    end
```

### KYC Status Transitions

| Current Status | Condition | Next Status |
|----------------|-----------|-------------|
| `pending` | Upload clear photo | `auto_approved` |
| `pending` | 1st blurry upload | `retry_1` |
| `retry_1` | 2nd blurry upload | `retry_2` |
| `retry_1` | Clear photo | `auto_approved` |
| `retry_2` | 3rd blurry upload | `under_review` |
| `retry_2` | Clear photo | `auto_approved` |
| `under_review` | Admin approves | `approved` |
| `under_review` | Admin rejects | `rejected` |
| `auto_approved` | - | `approved` (auto) |

---

## 4. Payment Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Server
    participant M as Midtrans
    participant DB as Database
    participant Email as Email Service

    U->>F: Click "Buy Now"
    F->>API: POST /api/orders
    API->>DB: Create Order (status: pending)
    DB-->>API: Order created
    API-->>F: Order details + token
    
    F->>API: POST /api/orders/[id]/payment
    API->>M: Create Snap transaction
    M-->>API: Snap token
    API-->>F: Redirect URL
    F->>U: Redirect to Midtrans
    
    U->>M: Complete payment
    M->>API: POST /payment/callback (webhook)
    API->>API: Verify signature
    API->>M: GET transaction status
    M-->>API: Status: settlement
    
    alt Payment Success
        API->>DB: Update order (status: paid)
        API->>Email: Send confirmation email
        API-->>M: 200 OK
        M-->>U: Redirect to success page
    else Payment Failed
        API->>DB: Update order (status: failed)
        API-->>M: 200 OK
        M-->>U: Show error
    end
```

### Payment States

```mermaid
stateDiagram-v2
    [*] --> pending: Create Transaction
    pending --> settlement: Payment Success
    pending --> deny: Payment Denied
    pending --> expire: Timeout (2h)
    pending --> cancel: User Cancel
    
    settlement --> refund: Refund Request
    settlement --> partial_refund: Partial Refund
    
    deny --> [*]: End
    expire --> [*]: End
    cancel --> [*]: End
    refund --> [*]: End
    partial_refund --> [*]: End
```

---

## 5. Admin KYC Approval Flow

```mermaid
flowchart TD
    Start([Admin Login]) --> Dashboard[Admin Dashboard]
    Dashboard --> KYCList[View KYC Queue]
    KYCList --> Filter{Filter By}
    
    Filter -->|Pending| PendingList[Pending KYC]
    Filter -->|Retry 1| Retry1List[Retry 1 KYC]
    Filter -->|Retry 2| Retry2List[Retry 2 KYC]
    Filter -->|Under Review| UnderReviewList[Under Review]
    
    PendingList --> Select1[Select Order]
    Retry1List --> Select2[Select Order]
    Retry2List --> Select3[Select Order]
    UnderReviewList --> Select4[Select Order]
    
    Select1 --> ViewDoc[View Passport Image]
    Select2 --> ViewDoc
    Select3 --> ViewDoc
    Select4 --> ViewDoc
    
    ViewDoc --> Review{Review Decision}
    
    Review -->|Approve| AddNotes1[Add Approval Notes]
    Review -->|Reject| AddNotes2[Add Rejection Reason]
    
    AddNotes1 --> UpdateDB1[Update Order Status<br/>KYC: approved<br/>Order: processing]
    AddNotes2 --> UpdateDB2[Update Order Status<br/>KYC: rejected<br/>Order: cancelled]
    
    UpdateDB1 --> LogAction1[Log Admin Action]
    UpdateDB2 --> LogAction2[Log Admin Action]
    
    UpdateDB1 --> SendEmail1[Send KYC Approved Email<br/>with QR Code]
    UpdateDB2 --> SendEmail2[Send Rejection Email<br/>with Refund Info]
    
    LogAction1 --> BackToQueue[Return to Queue]
    LogAction2 --> BackToQueue
    SendEmail1 --> BackToQueue
    SendEmail2 --> BackToQueue
    
    BackToQueue --> KYCList
```

### Admin Actions

| Action | API Endpoint | Effect |
|--------|--------------|--------|
| View KYC List | `GET /api/admin/kyc` | List pending documents |
| View Order Detail | `GET /api/admin/orders/[id]` | Full order info |
| Approve KYC | `PUT /api/admin/orders/[id]/kyc` | Status → approved |
| Reject KYC | `PUT /api/admin/orders/[id]/kyc` | Status → rejected |
| Update Status | `PUT /api/admin/orders/[id]/status` | Manual status change |

---

## 6. Database ERD

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ ADMIN_LOGS : performs
    PRODUCTS ||--o{ ORDERS : ordered_in
    ORDERS ||--o{ KYC_DOCUMENTS : has
    ORDERS ||--o{ REVIEWS : receives
    
    PROFILES {
        uuid id PK
        string email UK
        timestamp email_verified
        string name
        string phone
        string address
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        string name
        string description
        string category
        int duration
        string size
        int price
        int discount_percentage
        timestamp discount_start
        timestamp discount_end
        int stock
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    ORDERS {
        uuid id PK
        string order_number UK
        uuid user_id FK
        string full_name
        string customer_email
        string customer_phone
        string nationality
        timestamp arrival_date
        string flight_number
        uuid product_id FK
        int quantity
        int subtotal
        int discount
        int tax
        int total
        string payment_method
        string payment_status
        string payment_gateway_id
        string order_status
        string kyc_status
        int kyc_attempts
        string imei_number
        string access_token
        timestamp token_expires_at
        string qr_code_data
        string passport_public_id
        string passport_url
        int refund_amount
        string refund_reason
        string refund_status
        string activation_outlet
        string notes
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    
    KYC_DOCUMENTS {
        uuid id PK
        uuid order_id FK
        string passport_public_id
        string document_type
        string verification_status
        uuid verified_by FK
        string verification_notes
        timestamp created_at
        timestamp updated_at
    }
    
    REVIEWS {
        uuid id PK
        uuid order_id FK
        string user_name
        string user_email
        string country
        int rating
        string trip_type
        string trip_duration
        string review_text
        boolean is_approved
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }
    
    ADMIN_LOGS {
        uuid id PK
        uuid admin_id FK
        string action
        string target_id
        string target_type
        json details
        string ip
        string user_agent
        timestamp created_at
    }
```

### Table Relationships

| Table | Foreign Keys | Description |
|-------|--------------|-------------|
| **orders** | user_id → profiles.id, product_id → products.id | Links user and product |
| **kyc_documents** | order_id → orders.id, verified_by → profiles.id | Links to order and admin |
| **reviews** | order_id → orders.id | Links to order |
| **admin_logs** | admin_id → profiles.id | Links to admin user |

---

## 7. Email Workflow Timeline

```mermaid
gantt
    title Email Automation Timeline
    dateFormat X
    axisFormat %s
    
    section Order Flow
    Order Created           :0, 1
    Payment Success         :1, 2
    Order Confirmation Email :2, 3
    
    section KYC Flow
    KYC Upload              :3, 4
    KYC Approval            :4, 5
    KYC Approved Email      :5, 6
    
    section Pickup
    Arrival Date            :100, 101
    24h Before Reminder     :99, 100
    Pickup Complete         :101, 102
    
    section Post-Purchase
    Order Completed         :102, 103
    3 Days After            :105, 106
    Follow-up Email         :106, 107
```

### Email Triggers

| Email | Trigger | Timing |
|-------|---------|--------|
| Order Confirmation | Payment success | Immediate |
| KYC Approved | KYC status → approved | Immediate |
| Pickup Reminder | Arrival date - 24h | Scheduled |
| Follow-up Review | Order completion + 3 days | Scheduled |

---

## Usage Notes

### Viewing Diagrams

These diagrams use **Mermaid** syntax and can be viewed in:
1. **GitHub**: Native support (renders automatically)
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: https://mermaid.live
4. **Documentation**: Most modern documentation platforms support Mermaid

### Exporting Diagrams

To export as images:
```bash
# Using Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
mmdc -i FLOW_DIAGRAM.md -o diagrams/
```

---

*Last Updated: April 2026*
*Version: 1.0*

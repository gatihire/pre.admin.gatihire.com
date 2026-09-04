# WhatsApp Meta Templates — Complete Reference

> All WhatsApp message templates for GatiHire AI Screening, configured directly via Meta WhatsApp Business API.

---

## Table of Contents

1. [Template Inventory](#template-inventory)
2. [Meta Business Suite Setup](#meta-business-suite-setup)
3. [Template Details](#template-details)
4. [Environment Variables](#environment-variables)
5. [API Integration](#api-integration)
6. [Flow Diagrams](#flow-diagrams)
7. [Testing Guide](#testing-guide)

---

## Template Inventory

### Outbound Flow (HR reaches out to candidates)

| # | Template Name | Category | When Sent | Parameters |
|---|---|---|---|---|
| 1 | `talent_outreach` | MARKETING | Initial outreach | candidate_name, job_title, company_name, location, salary |
| 2 | `screening_invite` | UTILITY | After "Interested" reply | candidate_name, job_title, company_name |
| 3 | `call_nudge` | UTILITY | Pre-call notification | candidate_name, job_title, company_name |
| 4 | `tried_calling` | UTILITY | After call fails | candidate_name, job_title, company_name |
| 5 | `missed_call_reschedule` | UTILITY | Reschedule options | candidate_name, job_title, company_name |
| 6 | `reminder_nudge` | UTILITY | 4h silence follow-up | candidate_name, job_title, company_name |

### Inbound Flow (Candidate applies via board-app)

| # | Template Name | Category | When Sent | Parameters |
|---|---|---|---|---|
| 1 | `inbound_screening_invite` | UTILITY | Screening invite | candidate_name, job_title, company_name |
| 2 | `schedule_options` | UTILITY | Schedule call | candidate_name, job_title |
| 3 | `call_nudge` | UTILITY | Pre-call notification | candidate_name, job_title, company_name |
| 4 | `tried_calling` | UTILITY | After call fails | candidate_name, job_title, company_name |
| 5 | `missed_call_reschedule` | UTILITY | Reschedule options | candidate_name, job_title, company_name |
| 6 | `reminder_nudge` | UTILITY | 4h silence follow-up | candidate_name, job_title, company_name |

### Flow Summary

| Flow | Step 1 | Step 2 | Step 3 | Step 4+ |
|------|--------|--------|--------|---------|
| **Outbound** | `talent_outreach` → Interested? | `screening_invite` → Pick time | `call_nudge` → AI calls | `tried_calling` / `missed_call_reschedule` |
| **Inbound** | `inbound_screening_invite` → Pick time | `call_nudge` → AI calls | `tried_calling` / `missed_call_reschedule` | `reminder_nudge` at 4h |

**Shared Templates:**
- `call_nudge` — Pre-call notification (both flows)
- `tried_calling` — After call fails (both flows)
- `missed_call_reschedule` — Reschedule options (both flows)
- `reminder_nudge` — 4h silence follow-up (both flows)

---

## Meta Business Suite Setup

### Access WhatsApp Manager

1. Go to: `https://business.facebook.com/latest/whatsapp_manager/overview/?asset_id=2347186219423427`
2. Navigate to **Message Templates** → **Create Template**

### Create Templates

For each template:

1. Click **Create Template**
2. Enter template name (lowercase with underscores, max 512 chars)
3. Select category:
   - **MARKETING**: For promotional messages (outreach)
   - **UTILITY**: For transactional messages (screening, notifications)
4. Add body text with `{{1}}`, `{{2}}`, etc.
5. Add quick reply buttons (if applicable)
6. Add example values for each variable
7. Submit for review

### Approval Process

- Meta reviews templates (usually 24-48 hours)
- Status will be `PENDING` → `APPROVED` or `REJECTED`
- Only `APPROVED` templates can be sent
- Monitor status via WhatsApp Manager → Message Templates

---

## Template Details

### 1. Talent Outreach (`talent_outreach`)

**Category:** MARKETING

**Purpose:** HR reaches out to candidates — we already have their resume, just need to know if interested

**Template Name:** `talent_outreach`

**Body:**
```
Hi {{1}},

We came across your profile and think you would be a great fit for:

{{2}} at {{3}}
Location: {{4}}
Salary: {{5}}

If this sounds interesting, let us know and we can schedule a quick screening call.

Would you like to know more?
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Rahul Sharma |
| `{{2}}` | job_title | text | AI Engineer |
| `{{3}}` | company_name | text | TechCorp India |
| `{{4}}` | location | text | Bangalore, India |
| `{{5}}` | salary | text | 25-35 LPA |

**Buttons:**
- Custom: `[Interested]` (quick reply)
- Custom: `[Not Interested]` (quick reply)

**Tags:** `["ai_outreach", "job_recruitment"]`

**Meta Template API Payload:**
```json
{
  "name": "talent_outreach",
  "category": "MARKETING",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nWe came across your profile and think you would be a great fit for:\n\n{{2}} at {{3}}\nLocation: {{4}}\nSalary: {{5}}\n\nIf this sounds interesting, let us know and we can schedule a quick screening call.\n\nWould you like to know more?",
      "example": {
        "body_text": [
          ["Rahul Sharma", "AI Engineer", "TechCorp India", "Bangalore, India", "25-35 LPA"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Interested"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Not Interested"
        }
      ]
    }
  ]
}
```

---

### 2. Screening Invite (`screening_invite`)

**Category:** UTILITY

**Purpose:** After outbound candidate says "Interested" — schedule screening call

**Template Name:** `screening_invite`

**Body:**
```
Great, {{1}}!

Let us schedule your screening call for the {{2}} position at {{3}}.

Please select a convenient time below.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Priya Patel |
| `{{2}}` | job_title | text | Full Stack Developer |
| `{{3}}` | company_name | text | StartupXYZ |

**Buttons:**
- Custom: `[Call Now]` (quick reply)
- Custom: `[In 10 min]` (quick reply)
- Custom: `[In 30 min]` (quick reply)
- Custom: `[Today Evening]` (quick reply)
- Custom: `[Custom Time]` (quick reply)

**Tags:** `["ai_screening", "outbound"]`

**Meta Template API Payload:**
```json
{
  "name": "screening_invite",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Great, {{1}}!\n\nLet us schedule your screening call for the {{2}} position at {{3}}.\n\nPlease select a convenient time below.",
      "example": {
        "body_text": [
          ["Priya Patel", "Full Stack Developer", "StartupXYZ"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Call Now"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 10 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 30 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Today Evening"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Custom Time"
        }
      ]
    }
  ]
}
```

---

### 3. Schedule Options (`schedule_options`)

**Category:** UTILITY

**Purpose:** After candidate says "Interested"

**Template Name:** `schedule_options`

**Body:**
```
Great, {{1}}!

Let us schedule your screening call for the {{2}} position.

Please select a convenient time below.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Amit Kumar |
| `{{2}}` | job_title | text | Backend Engineer |

**Buttons:**
- Custom: `[Call Now]` (quick reply)
- Custom: `[In 10 min]` (quick reply)
- Custom: `[In 30 min]` (quick reply)
- Custom: `[Today Evening]` (quick reply)

**Tags:** `["ai_screening", "schedule"]`

**Meta Template API Payload:**
```json
{
  "name": "schedule_options",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Great, {{1}}!\n\nLet us schedule your screening call for the {{2}} position.\n\nPlease select a convenient time below.",
      "example": {
        "body_text": [
          ["Amit Kumar", "Backend Engineer"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Call Now"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 10 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 30 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Today Evening"
        }
      ]
    }
  ]
}
```

---

### 4. Call Nudge (`call_nudge`)

**Category:** UTILITY

**Purpose:** Pre-call notification (informational)

**Template Name:** `call_nudge`

**Body:**
```
Hi {{1}},

This is a reminder that our AI assistant will call you shortly for your screening regarding the {{2}} position at {{3}}.

The call will last approximately 5-10 minutes. Please answer when we call.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Sneha Gupta |
| `{{2}}` | job_title | text | Data Scientist |
| `{{3}}` | company_name | text | DataCo |

**Buttons:** None (informational only)

**Tags:** `["ai_call", "nudge"]`

**Meta Template API Payload:**
```json
{
  "name": "call_nudge",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nThis is a reminder that our AI assistant will call you shortly for your screening regarding the {{2}} position at {{3}}.\n\nThe call will last approximately 5-10 minutes. Please answer when we call.",
      "example": {
        "body_text": [
          ["Sneha Gupta", "Data Scientist", "DataCo"]
        ]
      }
    }
  ]
}
```

---

### 5. Tried Calling (`tried_calling`)

**Category:** UTILITY

**Purpose:** After call fails — retry notification

**Template Name:** `tried_calling`

**Body:**
```
Hi {{1}},

We attempted to call you regarding the {{2}} position at {{3}}, but were unable to connect.

Please select a convenient time for us to try again, or reply with your preferred time.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Vikram Singh |
| `{{2}}` | job_title | text | DevOps Engineer |
| `{{3}}` | company_name | text | CloudFirst |

**Buttons:**
- Custom: `[Call Now]` (quick reply)
- Custom: `[In 10 min]` (quick reply)
- Custom: `[In 1 hour]` (quick reply)

**Tags:** `["ai_call", "retry"]`

**Meta Template API Payload:**
```json
{
  "name": "tried_calling",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nWe attempted to call you regarding the {{2}} position at {{3}}, but were unable to connect.\n\nPlease select a convenient time for us to try again, or reply with your preferred time.",
      "example": {
        "body_text": [
          ["Vikram Singh", "DevOps Engineer", "CloudFirst"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Call Now"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 10 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 1 hour"
        }
      ]
    }
  ]
}
```

---

### 6. Missed Call Reschedule (`missed_call_reschedule`)

**Category:** UTILITY

**Purpose:** After Bolna call fails — reschedule options

**Template Name:** `missed_call_reschedule`

**Body:**
```
Hi {{1}},

We missed you for the {{2}} screening at {{3}}.

Please select a convenient time to reschedule, or reply with your preferred time.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Neha Reddy |
| `{{2}}` | job_title | text | Product Manager |
| `{{3}}` | company_name | text | InnovateInc |

**Buttons:**
- Custom: `[Call Now]` (quick reply)
- Custom: `[In 10 min]` (quick reply)
- Custom: `[In 1 hour]` (quick reply)
- Custom: `[Tomorrow Morning]` (quick reply)

**Tags:** `["ai_call", "reschedule"]`

**Meta Template API Payload:**
```json
{
  "name": "missed_call_reschedule",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nWe missed you for the {{2}} screening at {{3}}.\n\nPlease select a convenient time to reschedule, or reply with your preferred time.",
      "example": {
        "body_text": [
          ["Neha Reddy", "Product Manager", "InnovateInc"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Call Now"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 10 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 1 hour"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Tomorrow Morning"
        }
      ]
    }
  ]
}
```

---

### 7. Reminder Nudge (`reminder_nudge`)

**Category:** UTILITY

**Purpose:** 4 hours silence after outreach — gentle reminder

**Template Name:** `reminder_nudge`

**Body:**
```
Hi {{1}},

Following up regarding the {{2}} position at {{3}} in {{4}}.

If you are interested, please reply here or select an option below.
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Rohan Mehta |
| `{{2}}` | job_title | text | Frontend Developer |
| `{{3}}` | company_name | text | WebSolutions |
| `{{4}}` | location | text | Mumbai, India |

**Buttons:**
- Custom: `[Interested]` (quick reply)
- Custom: `[Not Interested]` (quick reply)

**Tags:** `["ai_outreach", "reminder"]`

**Meta Template API Payload:**
```json
{
  "name": "reminder_nudge",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nFollowing up regarding the {{2}} position at {{3}} in {{4}}.\n\nIf you are interested, please reply here or select an option below.",
      "example": {
        "body_text": [
          ["Rohan Mehta", "Frontend Developer", "WebSolutions", "Mumbai, India"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Interested"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Not Interested"
        }
      ]
    }
  ]
}
```

---

### 8. Inbound Screening Invite (`inbound_screening_invite`)

**Category:** UTILITY

**Purpose:** Candidate applied via board-app — invite them for screening call

**Template Name:** `inbound_screening_invite`

**Body:**
```
Hi {{1}},

Thank you for applying for {{2}} at {{3}}.

We would like to schedule a brief screening call to discuss your experience and the role. The call will take about 5-10 minutes.

When would be a good time for you?
```

**Variables:**
| Index | Name | Type | Example |
|-------|------|------|---------|
| `{{1}}` | candidate_name | text | Karan Joshi |
| `{{2}}` | job_title | text | ML Engineer |
| `{{3}}` | company_name | text | AI Labs |

**Buttons:**
- Custom: `[Call Now]` (quick reply)
- Custom: `[In 10 min]` (quick reply)
- Custom: `[In 30 min]` (quick reply)
- Custom: `[Today Evening]` (quick reply)
- Custom: `[Custom Time]` (quick reply)

**Tags:** `["ai_screening", "inbound"]`

**Meta Template API Payload:**
```json
{
  "name": "inbound_screening_invite",
  "category": "UTILITY",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nThank you for applying for {{2}} at {{3}}.\n\nWe would like to schedule a brief screening call to discuss your experience and the role. The call will take about 5-10 minutes.\n\nWhen would be a good time for you?",
      "example": {
        "body_text": [
          ["Karan Joshi", "ML Engineer", "AI Labs"]
        ]
      }
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Call Now"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 10 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "In 30 min"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Today Evening"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Custom Time"
        }
      ]
    }
  ]
}
```

---

## Environment Variables

### Meta WhatsApp Business API

```env
# Meta WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="2347186219423427"
WHATSAPP_ACCESS_TOKEN="your_system_user_access_token"
WHATSAPP_API_VERSION="v21.0"

# Webhook Configuration
WHATSAPP_VERIFY_TOKEN="gatihire_webhook_verify_2024"
WHATSAPP_APP_SECRET="your_app_secret"

# Template Names (must match Meta templates exactly)
WHATSAPP_TEMPLATE_TALENT_OUTREACH="talent_outreach"
WHATSAPP_TEMPLATE_SCREENING_INVITE="screening_invite"
WHATSAPP_TEMPLATE_SCHEDULE_OPTIONS="schedule_options"
WHATSAPP_TEMPLATE_CALL_NUDGE="call_nudge"
WHATSAPP_TEMPLATE_TRIED_CALLING="tried_calling"
WHATSAPP_TEMPLATE_MISSED_CALL_RESCHEDULE="missed_call_reschedule"
WHATSAPP_TEMPLATE_REMINDER_NUDGE="reminder_nudge"
WHATSAPP_TEMPLATE_INBOUND_SCREENING="inbound_screening_invite"
```

### Aisensy (Fallback)

```env
# Aisensy WhatsApp API Configuration (Fallback)
AISENSY_API_KEY="your_aisensy_api_key"
AISENSY_TEMPLATE_ID="Talent_Invite"
AISENSY_SENDER_ID="truckinzy"
```

---

## API Integration

### Send Template Message (Meta Cloud API)

```typescript
POST https://graph.facebook.com/{version}/{phone_number_id}/messages

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "{recipient_phone_number}",
  "type": "template",
  "template": {
    "name": "{template_name}",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "{variable_value}"
          }
        ]
      }
    ]
  }
}
```

### With Quick Reply Buttons

```typescript
{
  "type": "button",
  "sub_type": "quick_reply",
  "index": 0,
  "parameters": [
    {
      "type": "payload",
      "payload": "interested"
    }
  ]
}
```

### Webhook Payload (Inbound Messages)

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556745966",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Candidate Name"
                },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.HBgL...",
                "timestamp": "1234567890",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "interested",
                    "title": "Interested"
                  }
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

## Flow Diagrams

### Outbound Flow (HR reaches out)
```
1. HR triggers outreach → talent_outreach sent
   "Hi Rahul, we have a role for you: AI Engineer at TechCorp..."
   [Interested] [Not Interested]

2. If "Interested" → screening_invite sent
   "Great! Let's schedule your screening..."
   [Call Now] [In 10 min] [In 30 min] [Today Evening]

3. Candidate picks time → call_nudge sent (pre-call notification)
   "Hi Rahul, our AI will call you shortly..."

4. Bolna AI call placed → screening completed

5. If no response after 4h → reminder_nudge sent
   "Following up about the AI Engineer role..."

6. If no response after 8h → Escalate to HR
```

### Inbound Flow (Candidate applies via board-app)
```
1. Candidate applies → admin triggers screening
   inbound_screening_invite sent
   "Hi Karan, thank you for applying for ML Engineer at AI Labs..."
   [Call Now] [In 10 min] [In 30 min] [Today Evening]

2. Candidate picks time → call_nudge sent (pre-call notification)
   "Hi Karan, our AI will call you shortly..."

3. Bolna AI call placed → screening completed

4. If no response after 4h → reminder_nudge sent

5. If no response after 8h → Escalate to HR
```

### Direct Call Flow (call_now mode)
```
1. Admin clicks "Call Now"
2. call_nudge sent (pre-call notification)
3. Wait 60s
4. Bolna AI call placed
5. If fails → missed_call_reschedule sent
   [Call Now] [In 10 min] [In 1 hour] [Tomorrow Morning]
6. Max 2 attempts → status: unreachable
```

### Call Failure Flow
```
1. Bolna call fails (no-answer/busy/disconnected)
2. If retry_count < 2:
   - Send missed_call_reschedule
   - Schedule retry (15min for no-answer, 60min for other)
3. If retry_count >= 2:
   - Status → unreachable
   - HR notified: "All retries exhausted"
```

---

## Testing Guide

### Local Testing (Development)

1. **Start ngrok**
   ```bash
   ngrok http 3000
   ```

2. **Configure Webhooks**
   - Go to Meta App Dashboard → WhatsApp → Configuration
   - Set Webhook URL: `https://your-ngrok-url/api/whatsapp/webhook/meta`
   - Verify Token: `gatihire_webhook_verify_2024`
   - Subscribe to events: `messages`

3. **Test Each Template**
   - Go to a candidate in the pipeline
   - Click "WhatsApp Nudge" or "Call Now"
   - Check Meta dashboard for delivery status
   - Check ngrok for webhook events

### Test Flow Checklist

- [ ] **Outbound Flow:**
  - [ ] Send `talent_outreach`
  - [ ] Reply "Interested" → should send `schedule_options`
  - [ ] Reply "Not Interested" → should stop
  - [ ] Wait 4h → should send `reminder_nudge`
  - [ ] Wait 8h → should escalate to HR

- [ ] **Inbound Flow:**
  - [ ] Apply via board-app
  - [ ] Trigger WhatsApp-first screening
  - [ ] Candidate picks time → schedule call
  - [ ] Call completes → show results

- [ ] **Direct Call Flow:**
  - [ ] Click "Call Now"
  - [ ] `call_nudge` sent
  - [ ] Bolna call placed
  - [ ] Call fails → `missed_call_reschedule` sent

- [ ] **Retry Logic:**
  - [ ] First call fails → reschedule options
  - [ ] Second call fails → status: unreachable
  - [ ] No more WhatsApp after max retries

### Production Deployment

1. Set all environment variables in Vercel
2. Update webhook URL to `https://admin.gatihire.com/api/whatsapp/webhook/meta`
3. Deploy and test end-to-end

---

## Code References

| File | Purpose |
|---|---|
| `lib/whatsapp.ts` | Meta WhatsApp API integration |
| `app/api/whatsapp/webhook/meta/route.ts` | Meta webhook handler |
| `lib/aisensy.ts` | Aisensy integration (fallback) |
| `lib/call-orchestrator.ts` | Orchestrates screening campaigns |
| `lib/scheduled-call.ts` | QStash-based call scheduling |

---

*Last updated: 2026-09-04*

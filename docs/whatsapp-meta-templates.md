# WhatsApp Meta Templates — Complete Reference

> All WhatsApp message templates for GatiHire, configured directly via Meta WhatsApp Business API.

***

## Table of Contents

1. [Template Inventory](#template-inventory)
2. [Flow 1: Quick Screening (Existing)](#flow-1-quick-screening-existing)
3. [Flow 2: Info Collection + Screening (New)](#flow-2-info-collection--screening-new)
4. [Template Details](#template-details)
5. [Environment Variables](#environment-variables)
6. [Pipeline Statuses](#pipeline-statuses)

***

## Template Inventory

### Flow 1: Quick Screening (Existing)

| # | Template Name              | Category  | When Sent             |
| - | -------------------------- | --------- | --------------------- |
| 1 | `talent_outreach`          | MARKETING | Outbound initial      |
| 2 | `inbound_screening_invite` | UTILITY   | Inbound initial       |
| 3 | `screening_invite`         | UTILITY   | After "Interested"    |
| 4 | `schedule_options`         | UTILITY   | Schedule call         |
| 5 | `call_nudge`               | UTILITY   | Pre-call notification |
| 6 | `tried_calling`            | UTILITY   | After call fails      |
| 7 | `missed_call_reschedule`   | UTILITY   | Reschedule options    |
| 8 | `reminder_nudge`           | UTILITY   | 4h silence follow-up  |

### Flow 2: Info Collection + Screening (New)

| #  | Template Name           | Category  | When Sent                     |
| -- | ----------------------- | --------- | ----------------------------- |
| 9  | `outbound_info_request` | MARKETING | Outbound — collect basic info |
| 10 | `inbound_info_request`  | UTILITY   | Inbound — collect basic info  |
| 11 | `info_received_confirm` | UTILITY   | Info received, schedule call  |
| 12 | `ai_call_reassurance`   | UTILITY   | Before call — friendly note   |

### Flow 3: Rejection Reason + Extended Screening (New)

| #  | Template Name            | Category | When Sent                                                                                           |
| -- | ------------------------ | -------- | --------------------------------------------------------------------------------------------------- |
| 13 | `not_interested_reason`  | UTILITY  | Candidate says "Not interested" — capture reason via 6 buttons                                      |
| 14 | `detailed_info_request`  | UTILITY  | Extended screening — collect full details (CTC, experience, location, relocation, switching reason) |
| 15 | `screening_filtered_out` | UTILITY  | Candidate filtered out after pre-screen (e.g., comp mismatch)                                       |
| 16 | `second_reminder_nudge`  | UTILITY  | Second nudge when max\_call\_attempts > 2                                                           |
| 17 | `info_review_pending`    | UTILITY  | Candidate profile flagged for HR review — inform them we'll get back                                |

***

## Flow 1: Quick Screening (Existing)

### Outbound

```
talent_outreach → [Interested] → screening_invite → Pick time → call_nudge → AI call
```

### Inbound

```
inbound_screening_invite → Pick time → call_nudge → AI call
```

**When to use:** HR wants to quickly reach out and schedule calls without collecting extra info.

***

## Flow 2: Info Collection + Screening (Now uses detailed template)

### Outbound

```
1. talent_outreach → [Interested]
2. detailed_info_request → "Please share: CTC, Expected CTC, Experience, Notice Period, City, Relocate, Reason"
3. Candidate replies → AI pre-screen evaluation:
   - proceed → info_received_confirm → schedule AI call
   - needs_review → info_review_pending → HR reviews → approve → info_received_confirm
   - filtered_out → screening_filtered_out
```

### Inbound

```
1. inbound_screening_invite → [Interested]
2. detailed_info_request → "Please share: CTC, Expected CTC, Experience, Notice Period, City, Relocate, Reason"
3. Candidate replies → AI pre-screen evaluation:
   - proceed → info_received_confirm → schedule AI call
   - needs_review → info_review_pending → HR reviews → approve → info_received_confirm
   - filtered_out → screening_filtered_out
```

**When to use:** HR wants to collect all details upfront, pre-screen automatically, only spend AI call budget on qualified candidates. This is now the default for both inbound and outbound.

> **Note:** Templates 9 (`outbound_info_request`) and 10 (`inbound_info_request`) are replaced by template 14 (`detailed_info_request`) for all info collection flows.

***

## Flow 3: Rejection Reason + Extended Screening (New)

### Rejection Reason Flow

```
1. Candidate clicks [Not Interested]
2. not_interested_reason → 6 buttons: Not Looking / Comp Mismatch / Location / Already Placed / Role Not Relevant / Other
3. Candidate picks reason → rejection_reason captured in DB
```

### Extended Screening Flow (Now standard for all info collection)

```
1. Admin selects "Collect Info First" or "Extended Screening" mode
2. detailed_info_request → "Please share: CTC, Expected CTC, Experience, Notice Period, Current City, Willing to Relocate (yes/no), Reason for Switching"
3. Candidate replies in ONE message
4. info-collector parses reply + pre-screening evaluation:
   - Salary range check (±40% of job range for review, ±40%+ for reject)
   - Experience range check (50%-200% of job range)
   - Location mismatch check (if not willing to relocate)
   - Notice period check (>120 days flagged)
5. Decision:
   - proceed → info_received_confirm → schedule AI call
   - needs_review → info_review_pending → HR reviews in dashboard
   - filtered_out → screening_filtered_out sent with reason
```

**When to use:** Default for all info collection flows. Collects all details upfront, pre-screen automatically, only spend AI call budget on qualified candidates.

***

## Template Details

### 1. Talent Outreach (`talent_outreach`)pending name change 

**Category:** MARKETING

**Purpose:** HR reaches out to candidates — we already have their resume

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

**Variables:** candidate\_name, job\_title, company\_name, location, salary

**Buttons:** `[Interested]` `[Not Interested]`

***

### 2. Inbound Screening Invite (`inbound_screening_invite`)

**Category:** UTILITY

**Purpose:** Candidate applied via board-app — invite for screening

**Body:**

```
Hi {{1}},

Thank you for applying for {{2}} at {{3}}.

We would like to schedule a brief screening call to discuss your experience and the role. The call will take about 5-10 minutes.

When would be a good time for you?
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Call Now]` `[In 10 min]` `[In 30 min]` `[Today Evening]` `[Custom Time]`

***

### 3. Screening Invite (`screening_invite`) pending name change 

**Category:** UTILITY

**Purpose:** After outbound candidate says "Interested"

**Body:**

```
Great, {{1}}!

Let us schedule your screening call for the {{2}} position at {{3}}.

Please select a convenient time below.
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Call Now]` `[In 10 min]` `[In 30 min]` `[Today Evening]` `[Custom Time]`

***

### 4. Schedule Options (`schedule_options`)

**Category:** UTILITY

**Purpose:** After inbound candidate picks time

**Body:**

```
Great, {{1}}!

Let us schedule your screening call for the {{2}} position.

Please select a convenient time below.
```

**Variables:** candidate\_name, job\_title

**Buttons:** `[Call Now]` `[In 10 min]` `[In 30 min]` `[Today Evening]`

***

### 5. Call Nudge (`call_nudge`)

**Category:** UTILITY

**Purpose:** Pre-call notification

**Body:**

```
Hi {{1}},

This is a reminder that our team will call you shortly for your screening regarding the {{2}} position at {{3}}.

The call will last approximately 5-10 minutes. Please answer when we call.
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** None (informational only)

***

### 6. Tried Calling (`tried_calling`)

**Category:** UTILITY

**Purpose:** After call fails — retry notification

**Body:**

```
Hi {{1}},

We attempted to call you regarding the {{2}} position at {{3}}, but were unable to connect.

Please select a convenient time for us to try again, or reply with your preferred time.
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Call Now]` `[In 10 min]` `[In 1 hour]`

***

### 7. Missed Call Reschedule (`missed_call_reschedule`)

**Category:** UTILITY

**Purpose:** Reschedule after missed call

**Body:**

```
Hi {{1}},

We missed you for the {{2}} screening at {{3}}.

Please select a convenient time to reschedule, or reply with your preferred time.
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Call Now]` `[In 10 min]` `[In 1 hour]` `[Tomorrow Morning]`

***

### 8. Reminder Nudge (`reminder_nudge`)

**Category:** UTILITY

**Purpose:** 4h silence follow-up

**Body:**

```
Hi {{1}},

Following up regarding the {{2}} position at {{3}}.

If you are interested, please reply here or select an option below.
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Interested]` `[Not Interested]`

***

### 9. Outbound Info Request (`outbound_info_request`)

**Category:** MARKETING

**Purpose:** Collect basic info from outbound candidates before screening call

**Body:**

```
Hi {{1}},

We reached out to you about the {{2}} role at {{3}}.

Before we schedule your screening call, could you share a few quick details? This helps us understand your fit better.

Please reply with:
1. Current CTC (annual)
2. Expected CTC (annual)
3. Notice period (days)

Example: "8 LPA, 12 LPA, 30 days"
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Provide Details]` `[Skip — Schedule Call]`

***

### 10. Inbound Info Request (`inbound_info_request`)

**Category:** UTILITY

**Purpose:** Collect basic info from inbound candidates before screening call

**Body:**

```
Hi {{1}},

Thank you for applying for {{2}} at {{3}}.

Before we schedule your screening call, could you share a few quick details? This helps us understand your fit better.

Please reply with:
1. Current CTC (annual)
2. Expected CTC (annual)
3. Notice period (days)

Example: "8 LPA, 12 LPA, 30 days"
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** `[Provide Details]` `[Skip — Schedule Call]`

***

### 11. Info Received Confirm (`info_received_confirm`)

**Category:** UTILITY

**Purpose:** Confirm info received, ask for availability

**Body:**

```
Hi {{1}},

Thank you! We have received your details:

- Current CTC: {{2}}
- Expected CTC: {{3}}
- Notice Period: {{4}}

Now let us schedule your screening call. It is a quick 5-10 minute chat about your experience.

When would be a good time?
```

**Variables:** candidate\_name, current\_ctc, expected\_ctc, notice\_period

**Buttons:** `[Call Now]` `[In 10 min]` `[In 30 min]` `[Today Evening]`

***

### 12. AI Call Reassurance (`ai_call_reassurance`)

**Category:** UTILITY

**Purpose:** Reassure candidate before screening call

**Body:**

```
Hi {{1}},

Just a heads up — your screening call for {{2}} at {{3}} is coming up.

Quick note: Our team will ask you a few questions about your experience. It is casual and conversational, not a test. Just be yourself and share your experience so far.

See you soon!
```

**Variables:** candidate\_name, job\_title, company\_name

**Buttons:** None (informational only)

***

### 13. Not Interested Reason (`not_interested_reason`)

**Category:** UTILITY

**Purpose:** Capture why candidate is not interested via 6 quick-reply buttons

**Body:**

```
Hi {{1}},

We understand. Could you let us know the reason so we can improve our outreach?

Pick one:
```

**Variables:**

| Position | Name             | Example |
| -------- | ---------------- | ------- |
| `{{1}}`  | `candidate_name` | "Rahul" |

**Buttons (6 quick-reply):**

1. Not Looking to Switch (`reject_not_looking`)
2. Compensation Mismatch (`reject_comp_mismatch`)
3. Location Issue (`reject_location`)
4. Already Placed (`reject_placed`)
5. Role Not Relevant (`reject_role_not_relevant`)
6. Other (`reject_other`)

**Code:** `sendNotInterestedReason({ phoneNumber, candidateName })`

***

### 14. Detailed Info Request (`detailed_info_request`)

**Category:** UTILITY

**Purpose:** Collect full screening details in ONE reply for pre-screening

**Body:**

```
Hi {{1}},

Thank you for your interest in {{2}} at {{3}}.

To help us match you better, please share the following in ONE reply:

1. Current CTC
2. Expected CTC
3. Total experience (years)
4. Notice period
5. Current city
6. Willing to relocate? (yes/no)
7. Reason for switching

Example: "8 LPA, 12 LPA, 5 years, 30 days, Mumbai, yes, better growth"
```

**Variables:**

| Position | Name             | Example              |
| -------- | ---------------- | -------------------- |
| `{{1}}`  | `candidate_name` | "Rahul"              |
| `{{2}}`  | `job_title`      | "Operations Manager" |
| `{{3}}`  | `company_name`   | "SureShip"           |

**Buttons:** None (free-text reply)

**Code:** `sendDetailedInfoRequest({ phoneNumber, candidateName, jobTitle, companyName })`

***

### 15. Screening Filtered Out (`screening_filtered_out`)

**Category:** UTILITY

**Purpose:** Inform candidate they didn't pass pre-screening

**Body:**

```
Hi {{1}},

Thank you for sharing your details. After review, we feel this role may not be the best fit at this time.

Reason: {{2}}

We will keep your profile for future opportunities. All the best!
```

**Variables:**

| Position | Name             | Example                    |
| -------- | ---------------- | -------------------------- |
| `{{1}}`  | `candidate_name` | "Rahul"                    |
| `{{2}}`  | `reason`         | "Expected CTC above range" |

**Buttons:** None (informational only)

**Code:** `sendScreeningFilteredOut({ phoneNumber, candidateName, reason })`

***

### 16. Second Reminder Nudge (`second_reminder_nudge`)

**Category:** UTILITY

**Purpose:** Second nudge when max\_call\_attempts > 2

**Body:**

```
Hi {{1}},

Just a quick reminder about the {{2}} opportunity at {{3}}.

If you are still interested, please reply and we will connect you with our team.

Looking forward to hearing from you!
```

**Variables:**

| Position | Name             | Example              |
| -------- | ---------------- | -------------------- |
| `{{1}}`  | `candidate_name` | "Rahul"              |
| `{{2}}`  | `job_title`      | "Operations Manager" |
| `{{3}}`  | `company_name`   | "SureShip"           |

**Buttons:** None (informational only)

**Code:** `sendSecondReminderNudge({ phoneNumber, candidateName, jobTitle, companyName })`

***

### 17. Info Review Pending (`info_review_pending`)

**Category:** UTILITY

**Purpose:** Inform candidate their profile is under HR review after AI prescreen

**Body:**

```
Hi {{1}},

Thank you for sharing your details for the {{2}} position at {{3}}.

Our team is reviewing your profile. We will get back to you shortly with next steps.

We appreciate your patience!
```

**Variables:**

| Position | Name             | Example              |
| -------- | ---------------- | -------------------- |
| `{{1}}`  | `candidate_name` | "Rahul"              |
| `{{2}}`  | `job_title`      | "Operations Manager" |
| `{{3}}`  | `company_name`   | "SureShip"           |

**Buttons:** None (informational only)

**Code:** `sendInfoReviewPending({ phoneNumber, candidateName, jobTitle, companyName })`

**When sent:** After AI prescreen evaluates a candidate's info reply and decides `needs_review` (e.g., location mismatch, long notice period, borderline salary). The candidate is told we'll review and get back — HR then decides in the dashboard.

***

## Environment Variables

```env
# Flow 1: Quick Screening (Existing)
WHATSAPP_TEMPLATE_TALENT_OUTREACH="talent_outreach"
WHATSAPP_TEMPLATE_SCREENING_INVITE="screening_invite"
WHATSAPP_TEMPLATE_INBOUND_SCREENING="inbound_screening_invite"
WHATSAPP_TEMPLATE_SCHEDULE_OPTIONS="schedule_options"
WHATSAPP_TEMPLATE_CALL_NUDGE="call_nudge"
WHATSAPP_TEMPLATE_TRIED_CALLING="tried_calling"
WHATSAPP_TEMPLATE_MISSED_CALL_RESCHEDULE="missed_call_reschedule"
WHATSAPP_TEMPLATE_REMINDER_NUDGE="reminder_nudge"

# Flow 2: Info Collection + Screening (New)
WHATSAPP_TEMPLATE_OUTBOUND_INFO_REQUEST="outbound_info_request"
WHATSAPP_TEMPLATE_INBOUND_INFO_REQUEST="inbound_info_request"
WHATSAPP_TEMPLATE_INFO_RECEIVED_CONFIRM="info_received_confirm"
WHATSAPP_TEMPLATE_AI_CALL_REASSURANCE="ai_call_reassurance"

# Flow 3: Rejection Reason + Extended Screening (New)
WHATSAPP_TEMPLATE_NOT_INTERESTED_REASON="not_interested_reason"
WHATSAPP_TEMPLATE_DETAILED_INFO_REQUEST="detailed_info_request"
WHATSAPP_TEMPLATE_SCREENING_FILTERED_OUT="screening_filtered_out"
WHATSAPP_TEMPLATE_SECOND_REMINDER="second_reminder_nudge"
WHATSAPP_TEMPLATE_INFO_REVIEW_PENDING="info_review_pending"
```

***

## Pipeline Statuses

### Flow 1: Quick Screening

```
applied → whatsapp_sent → interested → call_scheduled → calling → call_done
```

### Flow 2: Info Collection + Screening

```
applied → info_requested → info_received → call_scheduled → calling → call_done
```

### Flow 3: Extended Screening

```
applied → info_requested → [pre-screen] → info_received → call_scheduled → calling → call_done
                           → needs_review → [HR approves] → info_received → call_scheduled → call_done
                           → filtered_out (if pre-screen fails)
```

### Rejection Reasons (captured on participants)

```
not_looking_to_switch | comp_mismatch | location_mismatch | already_placed | role_not_relevant | other
```

### Sub-Sections in AI Screen Tab

| Sub-Section      | Status           | What HR Sees                     |
| ---------------- | ---------------- | -------------------------------- |
| `pending`        | `applied`        | Not yet contacted                |
| `info_requested` | `info_requested` | Waiting for candidate info       |
| `info_received`  | `info_received`  | Info received, ready to schedule |
| `whatsapp_sent`  | `whatsapp_sent`  | Message sent, waiting            |
| `replied`        | `interested`     | Interested, ready to call        |
| `calling`        | `calling`        | AI call in progress              |
| `call_done`      | `completed`      | Screening complete               |
| `no_answer`      | `failed`         | No answer                        |
| `retrying`       | `retrying`       | Auto-retry scheduled             |
| `unreachable`    | `unreachable`    | All retries exhausted            |

***

*Last updated: 2026-09-04*

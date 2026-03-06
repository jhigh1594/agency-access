# New User Onboarding Email Flow

## Goal

Move a new self-serve agency user from signup to first value as quickly as possible:

`Signup -> first access link created -> link sent to client -> authorization tracked -> repeat usage / team expansion`

In this product, the clearest activation event is:

- `Primary activation:` first access link created
- `Secondary activation:` first client authorization completed

## Assumptions

- Audience is a marketing agency owner, operator, or account lead.
- User entered through the self-serve signup or free-trial path.
- The product promise is speed: replace 2-3 days of manual back-and-forth with a 5-minute client authorization flow.
- The onboarding experience already guides users to their first access request in under 60 seconds.
- Email should support in-app onboarding, not repeat it.

What the reader wants:

- get client access without chasing emails, screenshots, and permissions
- look organized in front of clients
- make onboarding repeatable instead of ad hoc

What is in the way:

- they have not created the first access link yet
- they do not know the fastest setup path
- once the link exists, they still need the client to complete it

## Framework Selection

- Email 1: `AIDA`
- Email 2: `PAS`
- Email 3: `BLUF + action prompt`
- Email 4: `BLUF + momentum`
- Email 5: `Before / After / Bridge`

## Best-Practice Setup

- Use plain-text or mostly plain-text emails for the first 3 sends.
- Send from a real person name, not a no-reply address.
- Keep one primary CTA per email.
- Suppress or swap emails when the user already completed the target action.
- Send on weekdays in the user's local time when possible.
- Personalize with `{{first_name}}`, `{{agency_name}}`, `{{client_name}}`, and milestone-based data when available.

## Recommended Sequence

This is a 5-email flow. If you want the shorter version, use emails 1, 2, and 4 only.

| Email | Timing | Trigger / audience | One job | Primary CTA |
|---|---|---|---|---|
| 1. Welcome + first step | Immediately after signup | All new users | Start onboarding and create first access link | Complete setup |
| 2. Get to first link | 1 day after signup | Users with no access link created | Remove friction to activation | Create your first link |
| 3. Send the link | 1 day after link creation | Users with a link but no client authorization yet | Get the link in front of the client | Send your link |
| 4. Track status + keep momentum | 3 days after signup or 2 days after link send | Users in progress | Bring them back to the dashboard and reinforce value | Check request status |
| 5. Turn one request into a workflow | 6-7 days after signup | Activated users | Expand usage through repeat requests, team invites, and branding | Go to dashboard |

## Behavior Rules

- If the user creates an access link before email 2, skip email 2 and move them to email 3.
- If the user's client authorizes before email 3, skip email 3 and send email 4 as a success/status email.
- If the user has already invited teammates, downplay team invites in email 5 and focus on repeat requests.
- If the user has not created a link by email 4, use the fallback version included below.

## Copy

### Email 1

**Name:** Welcome + first step  
**Send:** Immediately after signup  
**Target:** All new users

**Subject options**

- Your client access flow starts here
- Create your first access link in minutes
- Welcome to {{agency_name}}

**Preview text**

- The fastest way to get your first client authorization live.

**Primary CTA**

- `Complete setup`

**Draft**

Hi {{first_name}},

You signed up for one reason: get client access without the usual week of back-and-forth.

Agency Access gives you the shortest path to that outcome: one secure link your client can use to authorize the platforms you need.

Your fastest path to value:

1. Add your agency details
2. Choose a client
3. Select the platforms you need
4. Generate your access link

The goal is not to set up everything. The goal is to get your first real request live.

Once that link is out, your client can authorize access in one flow and you can track status from the dashboard instead of chasing updates in email.

Start here:

`{{onboarding_url}}`

If you want a quick recommendation, reply with the first client you plan to onboard and the platforms you need.

- {{sender_name}}

**Edit notes**

- Kept the promise concrete and aligned to the real onboarding flow.
- No extra links. No feature tour. One job: get them into setup.

---

### Email 2

**Name:** Get to first link  
**Send:** 1 day after signup  
**Target:** Users with no access link created

**Subject options**

- Your first access link is still waiting
- You are one link away from client access
- Finish your setup in under 5 minutes

**Preview text**

- Create one request, send one link, and stop chasing access manually.

**Primary CTA**

- `Create your first link`

**Draft**

Hi {{first_name}},

If you have not created your first access link yet, that is the only step that matters right now.

Most teams stall because they think they need to set up the whole account before they can use the product.

You do not.

Pick one real client. Create one real request. Send one real link.

That gets you to value fast:

1. Pick the client you want to onboard first
2. Choose the platforms they need to authorize
3. Generate the link
4. Send it

The alternative is the usual loop: ask for access, clarify what is needed, resend instructions, follow up again, and wait.

This product exists to cut that down to one clean request.

Create your first request here:

`{{onboarding_url}}`

If you hit a blocker, reply with the step where you got stuck. We can usually unblock it in one message.

- {{sender_name}}

**Edit notes**

- Focused on friction removal, not persuasion theater.
- "Start with one real client" reduces perceived setup cost.

---

### Email 3

**Name:** Send the link  
**Send:** 1 day after first access link creation  
**Target:** Users with a generated link and no completed client authorization

**Subject options**

- Your access link is ready to send
- Next step: send the client link
- The hard part is done

**Preview text**

- Your request is created. Now get it in front of the client.

**Primary CTA**

- `Send your link`

**Draft**

Hi {{first_name}},

Your first access link is ready.

Next move: send it to {{client_name}}.

Once they open it:

1. They open the link
2. They authorize each requested platform
3. You track status from your dashboard

If you want a clean note to forward, use this:

Hi {{client_name}},

Please use this secure link to grant us access to the platforms we need. It should take a few minutes:

`{{access_request_url}}`

Once you finish, we will be able to get started faster.

Open your request here:

`{{access_request_url}}`

- {{sender_name}}

**Edit notes**

- This email does not resell the product. It pushes the exact next action.
- Added a lightweight forwardable template to reduce delay.

---

### Email 4

**Name:** Track status + keep momentum  
**Send:** 3 days after signup or 2 days after link send  
**Target:** Users who are active but not fully through client authorization

**Subject options**

- Check your request status
- See where client access stands
- Keep your first onboarding moving

**Preview text**

- Your dashboard shows what is done, what is pending, and what to send next.

**Primary CTA**

- `Check request status`

**Draft**

Hi {{first_name}},

Once your first request is in motion, the dashboard matters more than your inbox.

You can use it to:

- see which requests are pending
- confirm when a client has authorized access
- create the next request without starting from scratch

Open your dashboard here:

`{{dashboard_url}}`

If your client has not completed the request yet, this is the right moment for a short follow-up.

If they already finished it, keep the momentum going and create the next request while the workflow is still fresh.

- {{sender_name}}

**Fallback for users with no link created yet**

Use this version instead of the draft above if the user is still unactivated:

Subject: Need help getting your first request live?

Hi {{first_name}},

If you have not launched your first request yet, pick one client and create one link.

That is the moment where the product starts paying off. Everything else can wait.

Start here:

`{{onboarding_url}}`

If you want help choosing which platforms to include, reply to this email and I will point you in the right direction.

- {{sender_name}}

**Edit notes**

- This is the check-in email. It should feel useful, not automated.
- The fallback keeps the sequence behavior-based without requiring a separate full email.

---

### Email 5

**Name:** Turn one request into a workflow  
**Send:** 6-7 days after signup  
**Target:** Users who created a request or completed first authorization

**Subject options**

- Turn this into your standard onboarding flow
- Your first request is the template
- Next step: make client onboarding repeatable

**Preview text**

- Build the habit: repeat requests, invite your team, and brand the experience.

**Primary CTA**

- `Go to dashboard`

**Draft**

Hi {{first_name}},

One completed request is useful.

What matters next is turning that one request into a repeatable onboarding workflow for your agency.

From your dashboard, you can:

- create requests for new clients faster
- track every authorization in one place
- invite teammates so access setup does not live with one person
- add your branding for a cleaner client experience

Go back to your dashboard here:

`{{dashboard_url}}`

If you are still testing, run one more real client through the flow. That is usually when the time savings become obvious.

- {{sender_name}}

**Edit notes**

- This closes the onboarding loop by shifting from activation to habit formation.
- Team invites and branding are framed as workflow upgrades, not feature dumps.

## Implementation Notes

- Use a human sender identity such as founder, customer success, or onboarding.
- Keep the first three emails plain-text.
- Do not add multiple CTA buttons.
- Instrument at least these events:
  - `signed_up`
  - `started_onboarding`
  - `created_access_link`
  - `sent_access_link`
  - `client_authorized`
  - `invited_teammate`
  - `created_second_request`
- Review after two weeks by segment:
  - signup to first link conversion
  - first link to first authorization conversion
  - reply rate on email 2 and email 4
  - activated users who create a second request

## Recommended Next Experiments

- Test subject line clarity against curiosity for emails 1 and 2.
- Test whether email 3 performs better with or without the forwardable client message.
- Test email 5 with a repeat-request CTA vs a team-invite CTA.
- Add branch logic for free users vs trial users once billing events are available in lifecycle tooling.

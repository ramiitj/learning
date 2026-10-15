# Proposal: LTI 1.3 launch and xAPI statements

**Status:** built, **off by default**, awaiting the creator's decision. **Legal review is required before either feature is switched on for any school.**
**Date:** 2026-10-15 · **Author:** security-privacy-engineer · **Spec:** `docs/03` "Interoperability and distribution", `docs/11`, `docs/12` "Distribution"

Nothing in this proposal changes how the live site handles data today. Both features sit behind environment flags (`LTI_ENABLED=1`, `XAPI_ENABLED=1`) that are unset in every environment, and an LMS can only launch lessons after the creator registers it in the console, enables it, and confirms with a passkey.

## 1. What each feature does

**LTI 1.3 launch (`LTI_ENABLED=1`).** A teacher adds a lesson to their school's LMS (Moodle, Canvas, Google Classroom through an LTI bridge, and so on). When a learner or teacher clicks it, the LMS and this site complete a standard LTI 1.3 / OpenID Connect handshake, and the lesson opens inside the LMS page. Teachers (LMS role *Instructor*) get classroom mode by default. The LMS cannot make the site do anything except open a published lesson.

**xAPI statements (`XAPI_ENABLED=1`, needs LTI).** For lessons launched from a school whose LMS registration includes a Learning Record Store (LRS), the lesson's learning moments (started, worked an interaction, answered, completed) are sent to **that school's own LRS** as xAPI 1.0.3 statements, under an anonymous id. Lessons opened any other way send nothing.

## 2. Exactly which data flows where

| # | Step | From → to | Data | Kept? |
|---|---|---|---|---|
| 1 | Login initiation `/api/lti/login` | LMS (via browser) → site | `iss`, `client_id`, `lti_deployment_id`, `target_link_uri`, `login_hint`, `lti_message_hint` | No. Checked against the registration; `login_hint` and `lti_message_hint` are passed back to the LMS untouched and never stored or logged. |
| 2 | State cookie | site → browser | random `state` and `nonce`, the platform record id; signed, 10 minutes, `HttpOnly; Secure; SameSite=None; Partitioned`, path `/api/lti/launch` only | In the browser for up to 10 minutes; deleted on launch. |
| 3 | Authentication | browser → LMS | the standard OIDC parameters | The LMS's own business. |
| 4 | Launch `/api/lti/launch` | LMS (via browser form post) → site | a signed `id_token`. **It may contain the learner's name, email, LMS user id, photo, course title** if the LMS is set to send them. | The token is verified, then **only** `iss`, `aud`, `azp`, `nonce`, LTI version, message type, `deployment_id`, `roles` and the custom parameters `lesson`, `mode`, `locale` are read. Everything else is dropped unread in `minimiseClaims` (`apps/web/src/lti/launch.ts`) before anything else runs; errors never carry claims. |
| 5 | Nonce record | site → database (Mumbai) | SHA-256 of (platform id, nonce), expiry | 20 minutes, so a token cannot be replayed. No identity. |
| 6 | Event log | site → database (Mumbai) | `lti.launch` with `{ platformId, lessonId }`; refused launches as `lti.launch-refused` with a reason code | Append-only audit log, like every system action. |
| 7 | Redirect to lesson | site → browser | lesson URL with `?lti=<token>`: platform id, lesson id, allowed frame origins, xAPI on/off; signed, 6 hours | In the URL, so it may appear in hosting request logs. That is why it carries **no per-learner id**. |
| 8 | Framing | site → browser | `Content-Security-Policy: frame-ancestors <the platform's registered origins>` on that lesson's page only | Every other page keeps `X-Frame-Options: SAMEORIGIN`. |
| 9 | Anonymous analytics | unchanged | the existing anonymous daily counts (`docs/11`) | Unchanged. |
| 10 | xAPI (only if on) | browser → `/api/lti/xapi` | the launch token, a random UUID made in the browser for this tab session, locale, mode, and events containing only lesson-defined ids (block, choice, check, detour) and right/wrong | Nothing stored. The id lives in `sessionStorage` only; it is in request bodies, never URLs. Free text, unknown fields and non-UUID actor ids are refused. |
| 11 | xAPI (only if on) | site → **the launching school's LRS** | statements: `actor = { account: { homePage: <site origin>, name: <that UUID> } }`, verb, lesson/block activity IRIs under the site origin, result (choice id, right/wrong, completion), language, mode. No timestamp, no registration, no name, email or LMS id. | In the school's LRS, under the school's control. Batched; a failed batch is retried once and then dropped (logged as `xapi.dropped` with platform id and count). The learner never waits. |
| 12 | Do Not Track / GPC | browser and server | if either is on, nothing in rows 10–11 is sent | — |

The LRS key and secret are entered by the creator, stored encrypted (AES-256-GCM, key derived from `PAYLOAD_SECRET`), write-only in the console and never sent to any browser. The tool's own signing key (`LTI_PRIVATE_KEY`) lives in the host's secret store; only its public half is served at `/api/lti/jwks`.

## 3. Why it is off by default

1. **Row 4 is unavoidable on our side.** LTI 1.3 sends an `id_token` the LMS composes. We can refuse to read identity claims, but if the LMS includes them, a child's name or email reaches our server in transit. The fix is on the LMS side (section 5), and it needs each school's cooperation.
2. **xAPI produces per-session records of a child's answers.** Our anonymous id is random and never linked to a person *by us*. But the school also holds LMS launch logs. A school that compares its LRS's storage times with its launch logs could work out which learner produced which statements. **In the school's hands these statements are therefore likely personal data of a child**, and per-learner answer records can look like the "tracking or behavioural monitoring" that DPDP section 9(3) restricts.
3. The constitution (Article 10), `docs/11` and CLAUDE.md say no personal data is collected from children in v1, and changes to data handling are always-ask (`platform/config/autonomy.json`: `learner-data-change`). Building it switched off and writing this proposal is how both rules are kept.

## 4. DPDP Act 2023 implications (for legal review)

These are an engineer's reading, not legal advice. **A lawyer must review this section and the school agreement before anything is switched on.**

- **Personal data (s.2(t)).** Data is personal if an individual is identifiable "by or in relation to" it. The launch (rows 1–8) is designed so that we hold nothing identifying. xAPI statements are anonymous to us but plausibly identifiable by the school (section 3.2).
- **Children (s.9).** Everyone in classes 8–12 is a child under the Act (under 18). s.9(1) requires verifiable parental consent before processing a child's personal data; s.9(3) prohibits tracking, behavioural monitoring and targeted advertising directed at children. The DPDP Rules, 2025 provide conditional exemptions from s.9(1) and s.9(3) for some classes of Data Fiduciary and purposes, including educational institutions for specified educational and safety purposes. **Whether a school's LRS use, and our part in it, falls within an exemption is the central question for counsel.** If it does not, parental consent is needed and the consent flow must be designed first (security-privacy-engineer, then legal review).
- **Roles.** With xAPI, the school decides why statements are collected and where they go, which suggests the **school is the Data Fiduciary** and the platform acts as its **Data Processor**. s.8(2) requires a valid contract between them. We would need a written data processing agreement with each school before enabling its LRS.
- **Security and breaches (s.8(5), s.8(6)).** Reasonable safeguards (here: signed tokens, single-use nonces, encrypted LRS secrets, https-only endpoints, creator-only registration with passkey re-authentication), and breach notification to the Board and affected people. The incident process in `docs/11` would need a school-notification step for LTI/xAPI incidents.
- **Location (s.16, `docs/11`).** The site stores everything in Mumbai. Statements go to the school's LRS, wherever the school hosts it. We should ask schools to host the LRS in India, and record where each one is.
- **Retention and erasure (s.8(7)).** We keep nothing beyond 20-minute nonce hashes and the audit event. The school's LRS retention is the school's responsibility under the agreement.
- **Commencement.** The Act's obligations commence in phases under the Rules; counsel should confirm which are in force at the time of any pilot.
- **Research.** Statements in a school LRS are not research data for us. Any research use still needs ethics approval and consent (`docs/11`, Article 12).

## 5. What the creator must decide

**Decision 1: enable LTI launch?**

| Option | What happens | Trade-offs |
|---|---|---|
| **A. Keep off (default)** | Teachers share plain lesson links, which already open outside the LMS. | No new risk. Less convenient for schools: lessons open in a new tab, not inside the LMS. |
| **B. LTI on, xAPI off** (recommended first step, after legal review) | Lessons open inside registered LMSs; nothing about learners goes anywhere. | Small residual risk: identity claims may transit our server unread (row 4). Mitigation: register the tool in each LMS with its privacy setting at "anonymous" / "do not send name or email" (Moodle: *Privacy* settings for the tool; Canvas: privacy level *anonymous*) and confirm this with the school in writing. |
| **C. LTI on, xAPI on per school** | As B, plus statements to that school's LRS. | Schools get evidence of learning in their own systems. Needs, per school: a data processing agreement, counsel's view on s.9 (exemption or parental consent), an LRS hosted in India, and a written statement of what the school will do with the data. Most risk; most value to schools. |
| **D. LTI on, class-level summaries instead of xAPI** (not built) | Schools get anonymous daily counts for their class, like the creator's analytics, instead of per-session statements. | Much lower re-identification risk (no per-session records); less detail, and not a standard LRS feed. Would need a short design and build. |

**Decision 2: which platforms.** Each LMS is registered by the creator in the console (*Access → Lti Platforms*), with passkey confirmation; each registration is in the audit log. Suggested: one pilot school's LMS first.

**Decision 3 (only with C): LRS consent with schools.** A written agreement per school covering: the school as Data Fiduciary and the platform as Data Processor; the exact statement contents (section 2, row 11); the LRS location (India); retention; the school's lawful basis for children's data (exemption or verifiable parental consent, as counsel advises); breach notification; and the school's commitment not to re-identify learners for any purpose beyond the educational one it states.

**Decision 4: operations.** Generate the tool key outside the repository (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out lti-private.pem`), put it in the Vercel secret store as `LTI_PRIVATE_KEY`, and delete the local file. `*.pem` is now git-ignored. The lead must create the database migration for the `lti-platforms` and `lti-nonces` collections before deployment.

## 6. Known limitations

- **Safari and other browsers that block third-party cookies** may refuse the state cookie in an LMS frame, so the launch fails with the localised "could not open" page. The cookie is partitioned (CHIPS), which works in Chromium and Firefox. A later fix is the LTI Client-Side postMessage storage specification, or asking the LMS to open the tool in a new window.
- **GET login initiation** puts `login_hint` (often an LMS user number) in a URL, which the host may write to its request logs, possibly outside India. Ask schools to configure POST initiation where their LMS allows it.
- Framing is allowed for the launched lesson's personal and classroom pages only. Links from a framed lesson to other pages (cover, teacher guide) will not display inside the frame after a full reload.
- No LTI services (grades, deep linking, names and roles) are called. `authTokenUrl` is stored for later.

## 7. Where it is

`apps/web/src/lti/` (core, tests), `apps/web/src/app/api/lti/{login,launch,jwks,xapi}/route.ts`, `apps/web/src/cms/collections/Lti.ts`, `apps/web/src/components/ltiXapi.ts`, the framing hook in `apps/web/src/proxy.ts`, and strings in the `lti` namespace of `apps/web/messages/*.json` (Hindi and Telugu are drafts awaiting native review).

# Runbook: incident response

Applies to: a problem reported from a lesson, an error alert, or anything the creator notices. Policy is in `docs/11`.

## 1. Notice

- Learner or teacher reports arrive as **Feedback** in the console (from "Report a problem" at the end of every lesson). Triage within one day.
- Error alerts arrive as an open **Decision** of kind "incident" (new error, or 20 of the same in 10 minutes) and, if `ALERT_WEBHOOK_URL` is set, a short message. Recent errors are on the Overview page.

## 2. Contain (minutes)

1. Open the lesson in the console. For a wrong, unsafe or broken lesson use **Unpublish** (Publish menu on the lesson); learners stop seeing it within seconds. To return to an earlier good version, open Versions, pick it, Restore, then publish it (this needs "Confirm with passkey").
2. For a platform-wide error after a deploy, roll back the deployment in Vercel (previous deployment, Promote) with the creator's approval.
3. Do not delete anything; unpublishing and versions keep the evidence.

## 3. Record

Create an **Incident** (console > Incidents): title, severity, lessons affected, linked feedback, what happened. Severity is **serious** when it involves safety, privacy or a significant factual error; otherwise minor.

## 4. Inform (serious only, within 48 hours)

Tell every affected pilot school, in plain language: what happened, what was done, what (if anything) they should do. Put the date and time in "Schools informed at". The Incidents list shows a red warning for any serious incident past 48 hours without it.

## 5. Fix and review

1. Fix through the normal route (draft, validation, publish with the creator's approval).
2. Fill in **Cause** and **Prevention step** (a test, a validator rule, a checklist item, a rubric change). Add the check if one is missing.
3. Set status to reviewed, then closed. Close the incident decision and note the feedback as fixed.

## Notes

- Error records hold no learner data: messages are scrubbed of emails and numbers and carry only the page path.
- Everything above is in the event log (`incidents.*`, `lessons.unpublish`, `decisions.*`, `error.new-fingerprint`, `error.spike`, `export.created`).

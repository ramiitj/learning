# 11 — Privacy, Safety and Compliance

## Children's data

India's Digital Personal Data Protection Act, 2023 requires verifiable parental consent to process the personal data of anyone under 18, and prohibits tracking, behavioural monitoring and targeted advertising directed at children. v1 therefore collects no personal data from learners. Learners use lessons anonymously or through teacher-issued class codes; progress is stored on the device. Analytics are aggregated and anonymous, with no persistent identifier linking sessions to a person. Before any feature collects personal data, the `security-privacy-engineer` subagent designs the consent flow and a lawyer reviews it.

## Hosting and security

Data hosted in an Indian region. Encryption in transit and at rest. Principle of least privilege for every service and agent. Secrets never in the repository. Dependency scanning and security tests in CI. The MCP server requires OAuth and is limited to the creator's account.

## Research use

Using learner interaction data for research or publication requires approval from the institutional ethics committee, appropriate consent from schools and parents, and anonymisation. The consent and data design is built with this in mind from the start so research is possible later without redesign.

## Usability testing with children

Sessions with children require written consent from parents and the school, a trained adult present, and no recording of faces or voices unless separately consented to.

## Content safety

Every lesson and asset is reviewed by the Accuracy & Safety Reviewer for age-appropriateness, stereotypes, biased examples, unsafe suggestions and privacy issues, then approved by the creator. Sharing by minors is limited to the classroom session. There is no messaging, commenting or public profile for children.

## Transparency statement

Published on the site and in teacher materials: lessons are created with AI assistance, reviewed and approved by the creator, and translations are reviewed by native speakers; generated media is labelled in the asset record and credited on the page.

## Accessibility

WCAG 2.2 AA, verified by automated tests and manual screen-reader and keyboard checks on every component.

## Incident response

Anyone can report a problem from any lesson. Reports are triaged within a day. A lesson can be unpublished or rolled back in one action from the console. For serious issues (safety, privacy, significant factual error), affected pilot schools are informed within 48 hours with what happened and what was done. Every incident is recorded with a short review of the cause and the prevention step.

## Licensing

Content licence is a deferred decision (open licence such as CC BY for reach, or proprietary). Third-party assets are used only with a recorded licence. Code dependencies are checked for licence compatibility.

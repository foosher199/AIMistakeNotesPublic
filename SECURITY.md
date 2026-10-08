# Security Policy

## Supported versions

Security fixes are applied to the latest code on the default branch. Older commits and forks are not maintained by this project.

## Reporting a vulnerability

Do not open a public issue. Use GitHub's **Security → Report a vulnerability** flow for this repository. If private vulnerability reporting is not available, contact a maintainer privately through the contact method on their GitHub profile.

Include the affected route or component, reproduction steps, impact, and a suggested mitigation when possible. Do not include real student content, production database rows, credentials, or access tokens. Maintainers will acknowledge the report when received and coordinate disclosure after a fix is available.

## Credential and data handling

- Store secrets in `.env.local` or the deployment platform's secret manager.
- Treat `SUPABASE_SERVICE_ROLE_KEY`, Provider keys, `CRON_SECRET`, and OAuth secrets as confidential.
- `NEXT_PUBLIC_*` values are included in browser bundles and must never contain privileged credentials.
- Rotate a credential immediately if it enters a commit, log, screenshot, build artifact, or issue.
- Keep uploaded exercises in private storage and preserve row-level security and ownership checks.
- Use synthetic or explicitly licensed fixtures with image metadata removed.

# Security Policy

## Supported Versions

The latest released version of chromoforge receives security fixes.

| Version | Supported |
| ------- | ------------------ |
| latest | :white_check_mark: |
| older  | :x:                |

## Reporting a Vulnerability

**Do not open a public issue for security problems.** Email
**aniruddhaadak80@users.noreply.github.com** (or use GitHub private vulnerability reporting on the
repo's Security tab). You will get an acknowledgement within 72 hours and a remediation timeline
after triage.

## Scope notes

chromoforge is an **educational simulation**. It contains wet-lab *toy* parts and a deliberately
restrictive biosafety policy engine (`packages/core/src/genetics/biosecurity.ts`). That policy is
a community norm, not a biological containment control — if you find a way to express a blocked
combination that the gate should catch, that **is** a security-relevant bug for this project. Please
report it.

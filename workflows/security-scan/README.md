# Security Scan

Adds a security-focused AI review pass to pull requests.

## Focus areas

- leaked credentials
- insecure route handlers
- unsafe shell execution
- auth bypasses and permission bugs

## Install

```bash
npx openci add minghinmatthewlam/openci --workflow security-scan --provider glm --runtime script --runner self-hosted-a8
```

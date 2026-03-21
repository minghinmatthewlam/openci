# Privacy

This document describes the current telemetry behavior of the OSS `openci` CLI.

## Install Telemetry

OpenCI sends a minimal install telemetry event only for identifiable GitHub installs where both of these are true:

- the source repo is public
- the destination repo is public

Telemetry is not sent for:

- private source repos
- private destination repos
- local-path installs
- installs where the repo identity cannot be determined

Disable telemetry entirely with either of these environment variables:

```bash
OPENCI_DISABLE_TELEMETRY=1
DO_NOT_TRACK=1
```

## Data Sent

The install telemetry payload includes only:

- `event` (`install_success`)
- `slug`
- `cliVersion`
- `dateBucket`
- `destinationRepo`

OpenCI does not send:

- workflow file contents
- repository secrets
- secret values
- local filesystem paths
- private repo installs

## Scope

This OSS repo contains the CLI-side telemetry behavior. The hosted backend that receives these events lives outside this repo.

# leequid-monitoring

This repository contains the monitoring service for the [LEEQUID protocol](https://github.com/dropps-io/leequid-contracts).

The monitoring service is in charge to monitor the protocol. This service is watching the networks for all the events and statuses that require monitoring.
This service can also take actions if anomalies are detected:
- In case of warning or alert, the monitoring service will send notifications through multiple communication channels

## Configuration

| name                       | comment                                                                                                         |
|----------------------------|-----------------------------------------------------------------------------------------------------------------|
| `RPC_URL`                  | URL of the LUKSO RPC (override ARCHIVE_NODE_HOSTS)                                                              |
| `ARCHIVE_NODE_HOSTS`       | Host names of the archive nodes used for the beacon api & RPC url                                               |
| `ORCHESTRATOR_KEY_ADDRESS` | address of the orchestrator key                                                                                 |
| `TWILIO_API_SID`           | twilio account or api SID                                                                                       |
| `TWILIO_SECRET`            | twilio secret or auth token                                                                                     |
| `TWILIO_SENDER_ID`         | twilio sender id                                                                                                |
| `DISCORD_WEBHOOK_URL`      | discord webhook url                                                                                             |
| `DISCORD_USER_IDS`         | discord user ids to tag in notifications. A space should be added between each id (e.g. "<@someid> <@someid>)") |
| `POSTGRES_URI`             | Connection string of the oracle database (overrides all POSTGRES_* varenvs)                                     |
| `POSTGRES_USER`            | User of the oracle database (default: postgres)                                                                 |
| `POSTGRES_PASSWORD`        | Password of the oracle database (default: postgres)                                                             |
| `POSTGRES_DB`              | Name of the oracle database (default: oracle)                                                                   |
| `POSTGRES_HOST`            | Host of the oracle database (default: localhost)                                                                |
| `CONTRACT_POOL`            | Address of the Pool contract                                                                                    |
| `CONTRACT_SLYX`            | Address of the sLYX contract                                                                                    |
| `CONTRACT_REWARDS`         | Address of the Rewards contract                                                                                 |

# Development

## Pre-requisites

To run the project locally, you will need to [authenticate with gcloud](https://cloud.google.com/sdk/gcloud/reference/auth/login) and set the project and zone:

```bash
gcloud auth login --update-adc
gcloud config set project <project_id>
gcloud config set compute/zone <projet_zone>
```

If you wish to use the application with *docker-compose*, add `GCLOUD_CREDENTIALS_PATH` to your .env, with the path of
the folder containing the gcloud_credentials folder (e.g. `C:/Users/samue/AppData/Roaming/gcloud`)

You need to have a [GCloud storage bucket](https://cloud.google.com/storage/docs/creating-buckets) to store your deposit data.

## Contracts

You have to deploy the [LEEQUID protocol](https://github.com/dropps-io/leequid-contracts/blob/master/scripts), and fill the contracts values in the [config](./config/default.json).

You may want to run a local version of the [smart contracts](https://github.com/dropps-io/leequid-contracts/blob/master/contracts).
For that, follow the steps detailed there: [Protocol Local Deployment]( https://github.com/dropps-io/leequid-contracts/blob/master/docs/local_tests.MD).
After following these steps, you will need to update the [config/default.json](./config/default.json) file with the deployed addresses
(just copy the content from the`local_addresses.json` file generated in the project root, to the `contracts` section of [config/dev.json](./config/default.json)),
or add them in the `.env` file :
```
CONTRACT_ORACLES=0x1234...
CONTRACT_DEPOSIT=0x1234...
CONTRACT_POOL=0x1234...
CONTRACT_SLYX=0x1234...
CONTRACT_REWARDS=0x1234...
CONTRACT_MERKLE_DISTRIBUTOR=0x1234...
LIQUIDITY_POOLS=0x1234...
```

## Start the project

- `yarn`
- `cp .env.example .env` and edit `.env`
- `npm run dev` - runs the `monitoring` service

### With docker (for development & integration tests)

- `yarn`
- `cp .env.example .env` and edit `.env`
- `docker-compose up`

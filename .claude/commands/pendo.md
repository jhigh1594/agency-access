---
description: Query Pendo data and segments
---

# Pendo Query

Quick access to Pendo analytics and segmentation data via the Pendo CLI.

## Usage

`/pendo <action>`

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `segments` | List all segments | `/pendo segments` |
| `visitors <days>` | Query visitors from last N days | `/pendo visitors 30` |
| `accounts <days>` | Query accounts from last N days | `/pendo accounts 30` |
| `activity` | Query activity metrics | `/pendo activity` |

## Examples

```
/pendo segments
# Lists all Pendo segments with IDs and names

/pendo visitors 30
# Shows visitor data from the last 30 days

/pendo accounts 7
# Shows account data from the last week
```

## Configuration

The Pendo CLI uses environment variables:
- `PENDO_SUBSCRIPTION_ID` - Your Pendo subscription ID
- `PENDO_APP_ID` - Your Pendo app ID

These are loaded from `.env` in the pendo-cli directory.

# AWS production controls

CloudFormation stack `mipresupuesto-production-controls` in `us-east-1` owns:

- A private S3 bucket with SSE-S3 encryption and a one-year retention lifecycle for CloudTrail logs.
- A multi-region CloudTrail trail for management events with log file validation.
- A CloudFront-scope WAF ACL for the MiPresupuesto API. AWS Common Rule Set is in Count mode for safe observation; a per-IP rate rule blocks more than 1,000 requests in five minutes.

Template: `production-controls.yaml`. The CloudFront distribution is `EQQ9O85TG8Z2V`. Its `WebACLId` association is managed on the CloudFront distribution itself, so preserve the stack output ARN when updating that distribution. Do not replace the distribution configuration with a partial document.

The WAF has an ongoing AWS charge (one ACL, two rules, and requests). The current public price example is about USD 7/month before requests; CloudTrail's first copy of management events is free, with S3 storage charged by use. No data-event selectors are enabled.

CloudFormation stack `mipresupuesto-encrypted-ebs-backups` in `us-east-1` creates one encrypted EBS recovery point per day for the production volume and retains at most seven. It creates a temporary crash-consistent snapshot, copies it with EBS encryption, and removes the temporary unencrypted copy. Duplicate invocations on the same UTC day are skipped. The Lambda runs at 08:15 UTC (02:15 Guatemala time) and its CloudWatch log group retains 14 days.

Template: `encrypted-ebs-backups.yaml`. The source volume is currently 8 GB. At the public EBS snapshot rate of USD 0.05/GB-month, seven full-volume copies would be a conservative upper estimate of about USD 2.80/month; actual incremental snapshot storage may be lower. This estimate excludes the existing WAF, CloudTrail/S3 storage, data transfer, and other account usage. A restore of the latest encrypted snapshot was verified on 2026-10-16 by mounting the temporary volume read-only and checking SQLite integrity; the temporary volume was deleted afterward. Snapshot restores are not automatic, so keep the recovery procedure available.

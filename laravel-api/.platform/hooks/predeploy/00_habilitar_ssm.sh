#!/bin/bash
set -euo pipefail

# Amazon Linux 2023 normally includes the AWS Systems Manager Agent. Keep it
# available so operators can administer the instance without opening SSH.
if ! rpm -q amazon-ssm-agent >/dev/null 2>&1; then
  dnf install -y amazon-ssm-agent
fi

systemctl enable --now amazon-ssm-agent

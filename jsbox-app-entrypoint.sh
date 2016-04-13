#!/bin/bash -e

AMQP_HOST=${AMQP_HOST:-127.0.0.1}
AMQP_PORT=${AMQP_PORT:-5672}
AMQP_VHOST=${AMQP_VHOST:-/}
AMQP_USER=${AMQP_USER:-guest}
AMQP_PASSWORD=${AMQP_PASSWORD:-guest}
WIT_THRESHOLD=${WIT_THRESHOLD:-0.8}

cat > ./config.json <<-EOM
{
    "name": "faqbrowser",
    "snappy": {
        "username": "${SNAPPY_USERNAME}",
        "endpoint": "https://app.besnappy.com/api/v1/",
        "account_id": "${SNAPPY_ACCOUNT_ID}",
        "default_faq": "${SNAPPY_DEFAULT_FAQ}"
    },
    "endpoints": {
        "sms": {
            "delivery_class": "sms"
        }
    },
    "wit": {
        "token": "${WIT_TOKEN}",
        "confidence_threshold": ${WIT_THRESHOLD}
    }
}
EOM

cat config.json

SET_OPTS=$(env | grep ^VUMI_OPT_ | sed -e 's/^VUMI_OPT_//' -e 's/=/ /' | awk '{printf("%s=%s:%s ", "--set-option", tolower($1), $2);}')

twistd \
    -n vumi_worker \
    --worker-class vxsandbox.worker.StandaloneJsFileSandbox \
    --hostname $AMQP_HOST \
    --port $AMQP_PORT \
    --vhost $AMQP_VHOST \
    --username $AMQP_USER \
    --password $AMQP_PASSWORD \
    --config jssandbox.yaml \
    $SET_OPTS \
    "$@"

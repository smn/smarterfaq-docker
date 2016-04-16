#!/bin/bash -e

AMQP_HOST=${AMQP_HOST:-127.0.0.1}
AMQP_PORT=${AMQP_PORT:-5672}
AMQP_VHOST=${AMQP_VHOST:-/}
AMQP_USER=${AMQP_USER:-guest}
AMQP_PASSWORD=${AMQP_PASSWORD:-guest}
WIT_THRESHOLD=${WIT_THRESHOLD:-0.8}
ES_ENDPOINT=${ES_ENDPOINT:"http://localhost:9200/_search"}

cat > ./config.json <<-EOM
{
    "name": "faqbrowser",
    "snappy": {
        "username": "${SNAPPY_USERNAME}",
        "endpoint": "https://app.besnappy.com/api/v1/",
        "account_id": "${SNAPPY_ACCOUNT_ID}",
        "default_faq": "${SNAPPY_DEFAULT_FAQ}"
    },
    "helpdesk_hours": [8, 16],
    "public_holidays": [
        "2015-01-01",
        "2015-03-21",
        "2015-04-03",
        "2015-04-06",
        "2015-04-27",
        "2015-05-01",
        "2015-06-16",
        "2015-08-09",
        "2015-08-10",
        "2015-09-24",
        "2015-12-16",
        "2015-12-25",
        "2015-12-26"
    ],
    "endpoints": {
        "sms": {
            "delivery_class": "sms"
        }
    },
    "wit": {
        "token": "${WIT_TOKEN}",
        "confidence_threshold": ${WIT_THRESHOLD}
    },
    "es": {
        "endpoint": "${ES_ENDPOINT}"
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

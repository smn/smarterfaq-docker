#!/bin/bash -e

AMQP_HOST=${AMQP_HOST:-127.0.0.1}
AMQP_PORT=${AMQP_PORT:-5672}
AMQP_VHOST=${AMQP_VHOST:-/}
AMQP_USER=${AMQP_USER:-guest}
AMQP_PASSWORD=${AMQP_PASSWORD:-guest}

twistd \
    -n vumi_worker \
    --worker-class vxsandbox.worker.StandaloneJsFileSandbox \
    --hostname $AMQP_HOST \
    --port $AMQP_PORT \
    --vhost $AMQP_VHOST \
    --username $AMQP_USER \
    --password $AMQP_PASSWORD \
    --config jssandbox.yaml

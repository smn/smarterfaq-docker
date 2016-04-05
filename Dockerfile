FROM praekeltfoundation/vxsandbox
MAINTAINER Praekelt Foundation <dev@praekeltfoundation.org>

# Install nodejs dependencies
RUN apt-get-install.sh npm
RUN npm install moment url querystring crypto lodash q jed vumigo_v01 vumigo_v02 go-jsbox-location go-jsbox-metrics-helper go-jsbox-ona go-jsbox-xform
COPY . /app
WORKDIR /app
RUN npm install .

# Workaround for sandboxed application losing context - manually install the
# *dependencies* globally.
# See https://github.com/praekelt/vumi-sandbox/issues/15
RUN mv ./node_modules /usr/local/lib/

ENTRYPOINT ["./jsbox-app-entrypoint.sh"]

CMD []

FROM praekeltfoundation/vxsandbox
MAINTAINER Praekelt Foundation <dev@praekeltfoundation.org>

# Install nodejs dependencies
COPY . /app
WORKDIR /app
RUN apt-get-install.sh npm && \
    npm install --global --production && \
    apt-get-purge.sh npm

ENTRYPOINT ["./jsbox-app-entrypoint.sh"]

CMD []

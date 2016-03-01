FROM praekeltfoundation/vxsandbox
MAINTAINER Praekelt Foundation <dev@praekeltfoundation.org>

# Install nodejs dependencies
COPY . /app
WORKDIR /app
RUN apt-get-install.sh npm
RUN npm install .

ENTRYPOINT ["./jsbox-app-entrypoint.sh"]

CMD []

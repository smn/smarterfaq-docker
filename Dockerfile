FROM mama-ng-jsbox

COPY . /app
WORKDIR /app

ENTRYPOINT ["jsbox-app-entrypoint.sh"]

CMD []

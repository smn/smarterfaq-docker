FROM mama-ng-jsbox

COPY . /app
WORKDIR /app

ENTRYPOINT ["app/jsbox-app-entrypoint.sh"]

CMD []

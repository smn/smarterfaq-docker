FROM mama-ng-jsbox

COPY . /app
WORKDIR /app

RUN npm install .

ENTRYPOINT ["./jsbox-app-entrypoint.sh"]

CMD []

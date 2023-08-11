FROM registry.apps.ocp-kk-prod-1.k8s.it.helsinki.fi/melinda-rest-api-bib/melinda-rest-api-bib-node-alpine:18-alpine
CMD ["/usr/local/bin/node", "index.js"]
WORKDIR /home/node

COPY --chown=node:node . build

RUN apk add -U --no-cache --virtual .build-deps git build-base sudo
RUN sudo -u node 'cd build && npm install && npm run build'
RUN sudo -u node cp -r build/package.json build/dist/* .
RUN sudo -u node npm install --prod
RUN sudo -u node npm cache clean -f
RUN apk del .build-deps
RUN rm -rf build tmp/* /var/cache/apk/*

USER node
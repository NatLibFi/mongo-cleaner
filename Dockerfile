FROM registry.apps.ocp-kk-prod-1.k8s.it.helsinki.fi/melinda-rest-api-bib/melinda-rest-api-bib-node-alpine:18-alpine as builder
WORKDIR /home/node

COPY --chown=node:node . build

RUN apk add -U --no-cache --virtual .build-deps git sudo \
  && sudo -u node sh -c 'cd build && npm ci --ignore-scripts && npm run build && rm -rf node_modules' \
  && sudo -u node sh -c 'cp -r build/dist/* build/package.json build/package-lock.json .' \
  && sudo -u node sh -c 'npm ci --ignore-scripts --production'

FROM registry.apps.ocp-kk-prod-1.k8s.it.helsinki.fi/melinda-rest-api-bib/melinda-rest-api-bib-node-alpine:18-alpine
CMD ["/usr/local/bin/node", "index.js"]
WORKDIR /home/node
USER node

COPY --from=builder /home/node/build/dist/ .
COPY --from=builder /home/node/node_modules node_modules
COPY --from=builder /home/node/package.json .
COPY --from=builder /home/node/package-lock.json .
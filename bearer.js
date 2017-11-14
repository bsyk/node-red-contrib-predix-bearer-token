module.exports = function (RED) {
  const uaa = require('predix-uaa-client');
  function BearerToken(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.config = Object.assign({}, config, node.credentials);
    node.statusText = 'Ready';
    node.status({ fill: 'grey', shape: 'ring', text: node.statusText });

    node.on('input', msg => {
      // Blinkenlights
      node.status({ fill: 'blue', shape: 'ring', text: node.statusText });
      const { uaaUrl, clientId, clientSecret } = node.config;
      uaa.getToken(uaaUrl, clientId, clientSecret).then((token) => {
        // Use token.access_token as a Bearer token Authroization header
        // in calls to secured services.
        const newMsg = Object.assign({}, msg, {
          token: token.access_token,
          headers: Object.assign({}, msg.headers, { authorization: `Bearer ${token.access_token}` })
        });
        node.statusText = 'Authenticated';
        setTimeout(() => node.status({ fill: 'green', shape: 'dot', text: node.statusText }), 100);
        node.send(newMsg);
      }).catch((err) => {
        node.error('Error getting token', err);
        if (err.statusCode) {
          switch (err.statusCode) {
            case 401:
              node.statusText = 'Unauthorized';
              node.status({ fill: 'red', shape: 'dot', text: node.statusText });
              break;
            case 404:
              node.statusText = 'Unknown UAA';
              node.status({ fill: 'red', shape: 'dot', text: node.statusText });
              break;
            default:
              node.statusText = err.message;
              node.status({ fill: 'red', shape: 'dot', text: node.statusText });
          }
        } else {
          node.statusText = err.message;
          node.status({ fill: 'red', shape: 'dot', text: node.statusText });
        }
      });
    });
  }

  RED.nodes.registerType('predix-bearer-token', BearerToken, {
    credentials: {
      clientId: { type: 'text' },
      clientSecret: { type: 'password' }
    }
  });
};

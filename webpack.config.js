const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = {
    plugins: [
        new NodePolyfillPlugin()
    ],
    resolve: {
      fallback: {
        "fs": false,
        "os": false,
        "path": false,
        "net": false,
        "dns": false,
        "tls": false,
        "async_hooks": false,
        "bson-ext": false,
        "kerberos": false,
        "@mongodb-js/zstd": false,
        "snappy": false,
        "aws4": false,
        "mongodb-client-encryption": false,
      }
    }
}
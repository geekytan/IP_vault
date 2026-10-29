const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy /pinning requests to https://api.pinata.cloud/pinning preserving the full path
  app.use(
    createProxyMiddleware("/pinning", {
      target: "https://api.pinata.cloud",
      changeOrigin: true,
      secure: true,
    })
  );
};

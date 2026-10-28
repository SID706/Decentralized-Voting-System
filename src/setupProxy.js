const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/rpc",
    createProxyMiddleware({
      target: process.env.RPC_TARGET || "http://localhost:8545",
      changeOrigin: true,
    })
  );
};

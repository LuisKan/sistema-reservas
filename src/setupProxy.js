const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('[PROXY] Setting up proxy for /api -> https://localhost:44319');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:44319',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> https://localhost:44319${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Agregar encabezados CORS a la respuesta
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        console.log(`[PROXY] Response ${proxyRes.statusCode} for ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('[PROXY ERROR]:', err.message);
        res.status(500).send('Proxy Error: ' + err.message);
      }
    })
  );
};

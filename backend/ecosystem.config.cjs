module.exports = {
  apps: [
    {
      name: 'imposter-backend',
      script: 'dist/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        FRONTEND_URL: 'https://coonh.de,http://coonh.de'
      }
    }
  ]
};

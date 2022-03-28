module.exports = {
  apps: [
    {
      name: 'hiring-backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    }
  ]
};

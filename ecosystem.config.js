module.exports = {
  apps: [
    {
      name: 'geo-spatial-explorer',
      script: '/storage/apps/explorer/node_modules/.bin/next',
      args: 'start --port 3001',
      cwd: '/storage/apps/explorer',
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/ubuntu/logs/geo-spatial-explorer-error.log',
      out_file: '/home/ubuntu/logs/geo-spatial-explorer-out.log',
      log_file: '/home/ubuntu/logs/geo-spatial-explorer-combined.log',
      time: true
    }
  ]
};

module.exports = {
  apps: [
    {
      name: 'workstream-svelte',
      script: 'build/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}

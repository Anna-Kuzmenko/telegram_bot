module.exports = {
    apps: [{
        name: 'cerera-telegram',
        script: './bin/www.js',
        instances: '2',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        exec_mode: 'cluster',
    }]
};

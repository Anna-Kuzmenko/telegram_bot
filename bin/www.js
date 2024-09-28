
import http from 'http';
import('dotenv').then((dotenv) => {
    dotenv.config();
}).then(async() => {
    import('../src/app/index.js') // 👈 There is import function available in CommonJS
        .then(({ app }) => {
            const { pid } = process;
            const port = normalizePort(process.env.LISTEN_PORT || '3000');
            app.set('port', port);

            const server = http.createServer(app);

            server.listen(port, () => {
                console.log(`Server started. Pid: ${pid} port: ${port}`);
            });

            server.on('error', onError);

            function normalizePort(val) {
                const port = parseInt(val, 10);
                if (isNaN(port))
                    return val;
                if (port >= 0)
                    return port;
                return false;
            }

            function onError(error) {
                if (error.syscall !== 'listen') {
                    throw error;
                }

                const bind = typeof port === 'string' ?
                    `Pipe ${port}` : `Port ${port}`;

                // handle specific listen errors with friendly messages
                switch (error.code) {
                    case 'EACCES':
                        console.error(`${bind} requires elevated privileges`);
                        process.exit(1);
                        break;
                    case 'EADDRINUSE':
                        console.error(`${bind} is already in use`);
                        process.exit(1);
                        break;
                    default:
                        throw error;
                }
            }
        });
});

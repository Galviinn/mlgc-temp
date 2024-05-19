require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            cors: {
              origin: ['*'],
            },
            payload: {
              maxBytes: 1000000 //Maximum size dari gambar yang terkirim
            }
        },
    });

    const model = await loadModel();
    server.app.model = model;

    server.route(routes);

    server.ext('onPreResponse', function (request, h) {
        const response = request.response;

        if (response instanceof InputError) {
            const newResponse = h.response({
                status: 'fail',
                message: `Terjadi kesalahan dalam melakukan prediksi`
            });
            newResponse.code(response.statusCode);
            return newResponse;
        }

        if (response.isBoom) {
            const newResponse = h.response({
                status: 'fail',
                message: response.message
            });
            newResponse.code(response.output.statusCode);
            return newResponse;
        }

        if (request.payload && request.payload.length > 1000000) {
            const newResponse = h.response({
                status: 'fail',
                message: 'Payload content length greater than maximum allowed: 1000000' //Max size handler
            });
            newResponse.code(413);
            return newResponse;
        }

        if (response.statusCode === 400 && response.message === 'Bad Request') {
            const newResponse = h.response({
                status: 'fail',
                message: 'Terjadi kesalahan dalam melakukan prediksi' //Common fail handler
            });
            newResponse.code(400);
            return newResponse;
        }

        return h.continue;
    });

    await server.start();
    console.log(`Server start at: ${server.info.uri}`);
})();

//Galviinn @ 2024 ~ Bangkit CC
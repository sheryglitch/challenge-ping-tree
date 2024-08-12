const HttpHashRouter = require('http-hash-router');
const sendJson = require('send-data/json');

const routeHandler = require('./routeHandler');

const router =  HttpHashRouter();

module.exports = router;

router.set('/api/targets', {
    POST: routeHandler.createTarget,
    GET: routeHandler.getTargets
});

router.set('/api/target/:id', {
    POST: routeHandler.updateTargetById,
    GET: routeHandler.getTargetById
});

router.set('/route', {
    POST: routeHandler.routeVisitor
});

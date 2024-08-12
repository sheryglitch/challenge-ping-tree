const sendJson = require('send-data/json');
const { parse } = require('url');

const targets = require('./targets');

module.exports = {
    createTarget,
    getTargets,
    getTargetById,
    updateTargetById
};

async function createTarget(req, res){
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
        const target = JSON.parse(body);
        try{
            await targets.saveTarget(target);
            res.statusCode = 201;
            sendJson(req, res, {status: 'Target saved successfully'});
        } catch (err){
            res.statusCode = 400;
            sendJson(req, res, {error: err.message}, );
        }
        
    })
}

async function getTargets(req, res){
    const targetList = await targets.getTargets();
    sendJson(req, res, targetList)
}

async function getTargetById(req, res, opts){
    const target = await targets.getTargetById(opts.params.id);
    if(target){
        sendJson(req, res, target);
    } else {
        res.statusCode = 404;
        sendJson(req, res, {error: 'Target not found' });
    }
}

async function updateTargetById(req, res, opts){
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
        const updatedTarget = JSON.parse(body);
        try{
            await targets.updateTargetById(opts.params.id, updatedTarget);
            res.statusCode = 201;
            sendJson(req, res, {status: 'Target updated successfully'});
        } catch (err){
            res.statusCode = 400;
            sendJson(req, res, {error: err.message}, );
        }
        
    })   
}

const sendJson = require('send-data/json');
const { parse } = require('url');

const targets = require('./targets');

module.exports = {
    createTarget,
    getTargets
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

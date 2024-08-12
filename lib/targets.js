const redis = require('./redis')
const { promisify } = require('util');

const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const delAsync = promisify(redis.del).bind(redis);

const TARGETS_KEY = 'targets';

module.exports = {
    getTargets,
    // getTargetById,
    saveTarget,
    // updateTargetById
};

async function getTargets(){
    const targets = await getAsync(TARGETS_KEY);
    return JSON.parse(targets || '[]');
}

async function saveTarget(target){
    const targets = await getTargets();
    const existingTarget = targets.find(t => t.id === target.id);
    if(existingTarget){
        throw new Error(`Target with ID ${target.id} already exists`);
    }
    targets.push(target);
    await setAsync(TARGETS_KEY, JSON.stringify(targets));
}


const redis = require('./redis')
const { promisify } = require('util');

const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const delAsync = promisify(redis.del).bind(redis);

const TARGETS_KEY = 'targets';

module.exports = {
    getTargets,
    getTargetById,
    saveTarget,
    updateTargetById
};

async function getTargets(){
    const targets = await getAsync(TARGETS_KEY);
    return JSON.parse(targets || '[]');
}

async function getTargetById(id){
    const targets = await getTargets();
    return targets.find(target => target.id === id);
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

async function updateTargetById(id, updatedTarget){
    let targets = await getTargets();
    const existingTarget = targets.find(t => (t.id === updatedTarget.id && t.id !== id));
    if(existingTarget){
        throw new Error(`Target with ID ${updatedTarget.id} already exists`);
    }
    targets = targets.map(target => (target.id === id ? updatedTarget : target));
    await setAsync(TARGETS_KEY, JSON.stringify(targets));
}

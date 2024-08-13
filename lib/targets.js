const redis = require('./redis');
const { promisify } = require('util');

const getAsync = promisify(redis.get).bind(redis);
const setAsync = promisify(redis.set).bind(redis);
const incrAsync = promisify(redis.incr).bind(redis);

const TARGETS_KEY = 'targets';

module.exports = {
    getTargets,
    getTargetById,
    saveTarget,
    updateTargetById,
    routeVisitor
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
    if (targets.some(t => t.id === target.id)) {
        throw new Error(`Target with ID ${target.id} already exists`);
    }
    targets.push(target);
    await setAsync(TARGETS_KEY, JSON.stringify(targets));
}

async function updateTargetById(id, updatedTarget){
    let targets = await getTargets();
    if (targets.some(t => t.id === updatedTarget.id && t.id !== id)) {
        throw new Error(`Target with ID ${updatedTarget.id} already exists`);
    }
    targets = targets.map(target => (target.id === id ? updatedTarget : target));
    await setAsync(TARGETS_KEY, JSON.stringify(targets));
}

async function routeVisitor(visitor){
    const targetList = await getTargets();
    const validTargets = await filterTargets(targetList, visitor);

    if (validTargets.length === 0) {
        return false;
    }

    const highestValueTarget = validTargets.reduce((max, target) => (target.value > max.value ? target : max), validTargets[0]);
    return { decision: "accept", url: highestValueTarget.url };
}

async function filterTargets(targets, visitor) {
    const currentHour = new Date(visitor.timestamp).getUTCHours();
    const validTargets = [];

    for (const target of targets) {
        const isGeoStateAccepted = target.accept.geoState.$in.includes(visitor.geoState);
        const isHourAccepted = target.accept.hour.$in.includes(currentHour.toString());
        const canAccept = await checkAcceptsPerDay(target);

        if (isGeoStateAccepted && isHourAccepted && canAccept) {
            validTargets.push(target);
        }
    }

    return validTargets;
}

async function checkAcceptsPerDay(target) {
    const today = new Date().toISOString().split("T")[0];
    const key = `accepts:${target.id}:${today}`;
    const accepts = await getAsync(key);

    if (parseFloat(accepts) >= parseFloat(target.maxAcceptsPerDay)) {
        return false;
    }

    await incrAsync(key);
    return true;
}

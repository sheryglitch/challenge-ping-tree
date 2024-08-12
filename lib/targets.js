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

async function routeVisitor(visitor){
    const targetList = await getTargets();
    const validTargets = await filterTargets(targetList, visitor);
    // console.log('hello targets:: ', validTargets);
    if (validTargets.length === 0) {
      return false;
    }
    const highestValueTarget = validTargets.sort(
      (a, b) => b.value - a.value
    )[0];
    return { decision: "accept", url: highestValueTarget.url }
}

async function filterTargets(targets, visitor) {
    const currentHour = new Date(visitor.timestamp).getUTCHours();
    const validTargets = await Promise.all(targets.map(async (target) => {
      const isGeoStateAccepted = target.accept.geoState.$in.includes(
        visitor.geoState
      );
      const isHourAccepted = target.accept.hour.$in.includes(
        currentHour.toString()
      );
      const canAccept = await checkAcceptsPerDay(target)
      if(isGeoStateAccepted && isHourAccepted && canAccept){
        return target;
      }
      return null;
    }));
    return validTargets.filter(target => target !== null);
  }
  
  async function checkAcceptsPerDay(target) {
    const today = new Date().toISOString().split("T")[0];
    const key = `accepts:${target.id}:${today}`;
    const accepts = await getAsync(key);
    
    if (parseFloat(accepts) >= parseFloat(target.maxAcceptsPerDay)) {
        return false;
    }

    await redis.incr(key);
    return true;
  }
  
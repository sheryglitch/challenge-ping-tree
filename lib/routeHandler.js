const { validateTarget, validateVisitor } = require('./validators');
const sendJson = require("send-data/json");
const { parse } = require("url");
const targets = require("./targets");

module.exports = {
  createTarget,
  getTargets,
  getTargetById,
  updateTargetById,
  routeVisitor,
};

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}


async function createTarget(req, res) {
  try {
    const target = await parseRequestBody(req);
    const { error } = validateTarget(target);

    if (error) {
      res.statusCode = 400;
      return sendJson(req, res, { error: error.details[0].message });
    }

    await targets.saveTarget(target);
    res.statusCode = 201;
    sendJson(req, res, { status: "Target saved successfully" });
  } catch (err) {
    res.statusCode = 400;
    sendJson(req, res, { error: err.message });
  }
}

async function getTargets(req, res) {
  try {
    const targetList = await targets.getTargets();
    sendJson(req, res, targetList);
  } catch (err) {
    res.statusCode = 500;
    sendJson(req, res, { error: "Failed to retrieve targets" });
  }
}

async function getTargetById(req, res, opts) {
  try {
    const target = await targets.getTargetById(opts.params.id);
    if (target) {
      sendJson(req, res, target);
    } else {
      res.statusCode = 404;
      sendJson(req, res, { error: "Target not found" });
    }
  } catch (err) {
    res.statusCode = 500;
    sendJson(req, res, { error: "Failed to retrieve target" });
  }
}

async function updateTargetById(req, res, opts) {
  try {
    const updatedTarget = await parseRequestBody(req);
    const { error } = validateTarget(updatedTarget);
    
    if (error) {
      res.statusCode = 400;
      return sendJson(req, res, { error: error.details[0].message });
    }
    
    await targets.updateTargetById(opts.params.id, updatedTarget);
    res.statusCode = 200;
    sendJson(req, res, { status: "Target updated successfully" });
  } catch (err) {
    res.statusCode = 400;
    sendJson(req, res, { error: err.message });
  }
}

async function routeVisitor(req, res) {
  try {
    const visitor = await parseRequestBody(req);
    const { error } = validateVisitor(visitor);
    
    if (error) {
      res.statusCode = 400;
      return sendJson(req, res, { error: error.details[0].message });
    }

    const decision = await targets.routeVisitor(visitor);

    if (decision) {
      res.statusCode = 200;
      sendJson(req, res, decision);
    } else {
      res.statusCode = 404;
      sendJson(req, res, { decision: "reject" });
    }
  } catch (err) {
    res.statusCode = 400;
    sendJson(req, res, { error: err.message });
  }
}

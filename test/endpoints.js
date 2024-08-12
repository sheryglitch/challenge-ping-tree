process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')

var server = require('../lib/server')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})


async function createTarget(targetData) {
  const url = '/api/targets';
  const opts = { method: 'POST', encoding: 'json' };

  return new Promise((resolve, reject) => {
    servertest(server(), url, opts, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    }).end(JSON.stringify(targetData));
  });
}

// Set up a target before running the route visitor test
test.serial.beforeEach(async (t) => {
  const targetData = {
    id: '1',
    url: 'http://example.com',
    value: '0.50',
    accept: {
      geoState: { $in: ['ca', 'ny'] },
      hour: { $in: ['13', '14', '15'] }
    },
    maxAcceptsPerDay: '10',
  };

  await createTarget(targetData);
});


test.serial.cb('createTarget', function (t) {
  const url = '/api/targets';
  const opts = { method: 'POST', encoding: 'json' };
  const targetData = {
    id: '2',
    url: 'http://example.com',
    value: '0.50',
    accept: {
      geoState: { $in: ['ca', 'ny'] },
      hour: { $in: ['13', '14', '15'] }
    },
    maxAcceptsPerDay: '10',
  };

  servertest(server(), url, opts, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 201, 'correct statusCode');
    t.is(res.body.status, 'Target saved successfully', 'correct response message');
    t.end();
  }).end(JSON.stringify(targetData));

  servertest(server(), url, opts, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 400, 'Bad Request');
    t.is(res.body.status, 'Target with ID 1 already exists', 'correct response message');
    t.end();
  }).end(JSON.stringify(targetData));
});

test.serial.cb('getTargets', function (t) {
  const url = '/api/targets';
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 200, 'correct statusCode');
    t.true(Array.isArray(res.body), 'response is an array');
    t.true(res.body.length > 0, 'targets are returned');
    t.end();
  });
});

test.serial.cb('getTargetById', function (t) {
  const url = '/api/target/1';
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 200, 'correct statusCode');
    t.is(res.body.id, '1', 'correct target ID');
    t.end();
  });
});

test.serial.cb('updateTargetById', function (t) {
  const url = '/api/target/1';
  const opts = { method: 'POST', encoding: 'json' };
  const updatedTargetData = {
    id: '1',
    url: 'http://example.com/updated',
    value: '0.75',
    accept: {
      geoState: { $in: ['ca', 'ny'] },
      hour: { $in: ['16', '17', '18'] }
    },
    maxAcceptsPerDay: '15',
  };

  servertest(server(), url, opts, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 200, 'correct statusCode');
    t.is(res.body.status, 'Target updated successfully', 'correct response message');
    t.end();
  }).end(JSON.stringify(updatedTargetData));
});

test.serial.cb('rejectedRouteVisitor', function (t) {
  const url = '/route';
  const opts = { method: 'POST', encoding: 'json' };
  const visitorData = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  };

  servertest(server(), url, opts, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 404, 'Not found');
    t.is(res.body.decision, 'reject');
    t.end();
  }).end(JSON.stringify(visitorData));
});

test.serial.cb('acceptedRouteVisitor', function (t) {
  const url = '/route';
  const opts = { method: 'POST', encoding: 'json' };
  const visitorData = {
    geoState: 'ca',
    publisher: 'abc',
    timestamp: '2018-07-19T13:28:59.513Z'
  };

  servertest(server(), url, opts, function (err, res) {
    t.falsy(err, 'no error');
    t.is(res.statusCode, 200, 'correct statusCode');
    t.is(res.body.decision, 'accept', 'decision is accept');
    t.truthy(res.body.url, 'URL is returned');
    t.end();
  }).end(JSON.stringify(visitorData));
});
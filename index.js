var scrypt = require("scrypt-async");
var randomBytes = require("randombytes-shim");

var config = {
  dkLen: 8,
  N: 2048,
  r: 8,
  p: 1,
  encoding: 'binary',
}

/**
 * Compute the number of bits of difficulty to aim for for a given average time of PoW.
 */
function difficulty(hashes_per_time, average_time) {
  return Math.max(0, Math.round(Math.log2(hashes_per_time * average_time) - 0.5)) || 0;
}

/**
 * Returns the target vector for a particular number of bits of difficulty.
 */
function target(difficulty) {
  var target = new Uint8Array(config.dkLen).fill(255);
  for (var x=0; x<difficulty; x++) {
    var position = Math.floor(x / 8);
    var index = x % 8 + 1;
    target[Math.floor(x / 8)] &= (0xff >> index);
  }
  return target;
}

// Inner function for measurement.
function domeasure(iterations, callback, iteration, start) {
    if (iteration) {
      scrypt("x", "y" + Math.random() + "-iteration", config, function(key) {
        domeasure(iterations, callback, iteration - 1, start);
      });
    } else {
      var hashrate = 1000.0 * iterations / ((new Date().getTime()) - start);
      callback(hashrate);
    }
}

/**
 * Measure how many hashes per second the current device is capable of.
 */
function measure(iterations, callback) {
  var start = start || new Date().getTime();
  if (typeof(iterations) == "function") {
    callback = iterations;
    iterations = 100;
  } else {
    iterations = iterations || 100;
  }
  var iteration = iterations;
  return new Promise(function(resolve, reject) {
    domeasure(iterations, function(hashrate) {
      if (callback) {
        callback(hashrate);
      }
      resolve(hashrate);
    }, iteration, start);
  });
}

// inner function for doing PoW.
function dopow(h, target, callback, noncefn, smallest, i) {
  var nonce = noncefn(i);
  scrypt(h, nonce, config, function(key) {
      smallest = toHex(key) < toHex(smallest) ? key : smallest;
      if (toHex(smallest) <= toHex(target)) {
        callback(smallest, nonce, i);
      } else {
        // avoid maximum call stack exceeded
        // by going async
        setTimeout(function() {
          dopow(h, target, callback, noncefn, smallest, i + 1);
        });
      }
  });  
}

/**
 * Compute an scrypt proof-of-work token for a particular text and target difficulty vector.
 * Using the specified function for generating nonces (defaults to randomBytes(8)).
 */
function pow(h, target, noncefn, callback) {
  var smallest = new Uint8Array(config.dkLen).fill(255);
  var noncefn = noncefn || function(i) { return randomBytes(8); };
  return new Promise(function(resolve, reject) {
    dopow(h, target, function(hash, nonce, i) {
      if (callback) {
        callback(hash, nonce, i);
      }
      resolve({"hash": hash, "nonce": nonce, "iterations": i});
    }, noncefn, smallest, 0);
  });
}


/**
 * Verify some previously computed scrypt proof-of-work token (nonce) for a particular text & target difficulty vector.
 */
function verify(h, nonce, target, callback) {
  return new Promise(function(resolve, reject) {
    scrypt(h, nonce, config, function(hash) {
      if (hash.length == target.length && target.length == config.dkLen && toHex(hash) < toHex(target)) {
        if (callback) {
          callback(true);
        }
        resolve(true);
      } else {
        if (callback) {
          callback(false);
        }
        resolve(false);
      }
    });
  });
}

// https://stackoverflow.com/a/39225475/2131094
function toHex(x) {
  return x.reduce(function(memo, i) {
    return memo + ('0' + i.toString(16)).slice(-2);
  }, '');
}

function fromHex(x) {
  return new Uint8Array(x.match(/.{1,2}/g).map(function(b) {
    return parseInt(b, 16);
  }));
}

module.exports = {
  config: config,
  pow: pow,
  verify: verify,
  target: target,
  difficulty: difficulty,
  measure: measure,
  toHex: toHex,
  fromHex: fromHex,
}

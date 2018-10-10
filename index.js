var scrypt = require("scrypt-async");
var randomBytes = require("randombytes-shim");

/**
 * s-crypt configuration parameters.
 * Defaults to using 2mb of memory per hash with 8 byte size.
 */
var config = {
  dkLen: 8,
  N: 2048,
  r: 8,
  p: 1,
  encoding: 'binary',
}

/**
 * Calculates the number of bits of difficulty required to consume an
 * average of `average_time` CPU given a hash rate of `hashes_per_time`.
 * Time can be in any units (e.g. seconds).
 * @param hashes_per_time the hash rate of the current machine (as measured by `measure`).
 * @param average_time the average time you want the machine to hash for.
 * @returns the number of bits of difficulty required.
 */
function difficulty(hashes_per_time, average_time) {
  return Math.max(0, Math.round(Math.log2(hashes_per_time * average_time) - 0.5)) || 0;
}

function target(difficulty) {
  var target = new Uint8Array(config.dkLen).fill(255);
  for (var x=0; x<difficulty; x++) {
    var position = Math.floor(x / 8);
    var index = x % 8 + 1;
    target[Math.floor(x / 8)] &= (0xff >> index);
  }
  return target;
}

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

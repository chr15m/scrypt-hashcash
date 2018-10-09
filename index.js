var scrypt = require("scrypt-async");

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
  return Math.max(0, Math.round(Math.log2(hashes_per_time * average_time) - 0.5));
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

function dopow(h, target, callback, noncefn, smallest, i) {
  scrypt(h, noncefn(i), config, function(key) {
      smallest = toHex(key) < toHex(smallest) ? key : smallest;
      if (toHex(smallest) <= toHex(target)) {
        callback(smallest);
      } else {
        // avoid maximum call stack exceeded
        // by going async
        setTimeout(function() {
          dopow(h, target, callback, noncefn, smallest, i + 1);
        });
      }
  });  
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
  return new Promise(function(resolve, reject) {
    var start = start || new Date().getTime();
    if (typeof(iterations) == "function") {
      callback = iterations;
      iterations = 100;
    } else {
      iterations = iterations || 100;
    }
    var iteration = iterations;
    domeasure(iterations, function(hashrate) {
      if (callback) {
        callback(hashrate);
      }
      resolve(hashrate);
    }, iteration, start);
  });
}

function pow(h, target, callback, noncefn) {
  if (typeof(target) == "string") {
    target = fromHex(target);
  }
  var smallest = new Uint8Array(config.dkLen).fill(255);
  var noncefn = noncefn || function(i) { return Math.random() + "-" + i + "-iteration"; };
  dopow(h, target, callback, noncefn, smallest, 0);
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
  target: target,
  difficulty: difficulty,
  measure: measure,
  toHex: toHex,
  fromHex: fromHex,
}

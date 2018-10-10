var s = require("./index.js");
var test = require("tape");

var deterministicnoncefn = function(i) { return i.toString(); };
var material = "0:030626:adam@cypherspace.org";

var difficulty_vectors = [
  [ 255, 255, 255, 255, 255, 255, 255, 255 ],
  [ 127, 255, 255, 255, 255, 255, 255, 255 ],
  [ 63, 255, 255, 255, 255, 255, 255, 255 ],
  [ 31, 255, 255, 255, 255, 255, 255, 255 ],
  [ 15, 255, 255, 255, 255, 255, 255, 255 ],
  [ 7, 255, 255, 255, 255, 255, 255, 255 ],
  [ 3, 255, 255, 255, 255, 255, 255, 255 ],
  [ 1, 255, 255, 255, 255, 255, 255, 255 ],
  [ 0, 255, 255, 255, 255, 255, 255, 255 ],
  [ 0, 127, 255, 255, 255, 255, 255, 255 ],
  [ 0, 63, 255, 255, 255, 255, 255, 255 ],
  [ 0, 31, 255, 255, 255, 255, 255, 255 ],
  [ 0, 15, 255, 255, 255, 255, 255, 255 ],
  [ 0, 7, 255, 255, 255, 255, 255, 255 ],
  [ 0, 3, 255, 255, 255, 255, 255, 255 ],
  [ 0, 1, 255, 255, 255, 255, 255, 255 ],
  [ 0, 0, 255, 255, 255, 255, 255, 255 ],
  [ 0, 0, 127, 255, 255, 255, 255, 255 ],
  [ 0, 0, 63, 255, 255, 255, 255, 255 ],
  [ 0, 0, 31, 255, 255, 255, 255, 255 ],
];

test("measurement test", function (t) {
  t.plan(2);

  s.measure(function(d) {
    t.true(d > 0, "difficulty of " + Math.round(d) + " hashes per second");
  });

  s.measure(10, function(d) {
    t.true(d > 0, "difficulty over 10 hashes of " + Math.round(d) + " hashes per second");
  });
});

test("measurement test with modified parameters", function(t) {
  t.plan(1);

  var originalN = s.config.N;
  s.config.N = 2;

  s.measure(1000, function(d) {
    s.config.N = originalN;
    t.true(d > 0, "difficulty with low N=1 over 1000 hashes of " + Math.round(d) + " hashes per second");
  });
});

test("measurement with promise API", function(t) {
  t.plan(2);

  s.measure().then(function(d) {
    t.true(d > 0, "difficulty of " + Math.round(d) + " hashes per second");
    return s.measure(10);
  }).then(function(d) {
    t.true(d > 0, "difficulty over 10 hashes of " + Math.round(d) + " hashes per second");
  });
});

test("compute difficulty", function(t) {
  t.plan(3);

  t.equals(s.difficulty(100, 10), 9, "difficulty calculation result");
  t.equals(s.difficulty(0, 0), 0, "difficulty calculation floor");
  t.equals(s.difficulty(-10000, 100), 0, "difficulty calculation stupid");
});

test("check target vector", function(t) {
  t.plan(difficulty_vectors.length);

  for (var i=0; i<difficulty_vectors.length; i++) {
    t.deepEquals(Array.from(s.target(i)), difficulty_vectors[i], "target vector " + i + " matches");
  }
});

test("basic pow with callback & deterministsic noncefn", function(t) {
  t.plan(3);

  s.pow(material, s.target(4), deterministicnoncefn, function(hash, nonce, i) {
    t.deepEquals(hash, [ 15, 200, 215, 223, 6, 50, 198, 48 ], "found expected hash " + s.toHex(hash));
    t.equals(i, 5, "found after expected iterations");
    t.equals(nonce, "5", "found expected nonce");
  });
});

test("basic pow with promise API & deterministic noncefn", function(t) {
  t.plan(3);

  s.pow(material, s.target(4), deterministicnoncefn).then(function(found) {
    t.deepEquals(found.hash, [ 15, 200, 215, 223, 6, 50, 198, 48 ], "found expected hash " + s.toHex(found.hash));
    t.equals(found.iterations, 5, "found after expected iterations");
    t.equals(found.nonce, "5", "found expected nonce");
  });
});

test("default noncefn test", function(t) {
  t.plan(6);

  s.pow(material, s.target(4)).then(function(found) {
    t.true(found.iterations > 0, "check iterations performed");
    t.equals(found.nonce.length, 8, "check nonce length");
    t.equals(found.hash.length, 8, "check hash length");
    t.equals(s.toHex(found.hash).substr(0,1), "0", "check first nibble is 0 (" + s.toHex(found.hash) + ")");
    t.true(found.hash instanceof Uint8Array, "check hash type");
    t.true(found.nonce instanceof Uint8Array, "check nonce type");
  });
});

test("verify pow", function(t) {
  t.plan(2);

  var target = s.target(4);

  s.pow(material, target, deterministicnoncefn).then(function(found) {
    s.verify(material, found.nonce, target).then(function(v) {
      t.true(v, "verification passed");
    });

    s.verify(material, "1", target).then(function(v) {
      t.false(v, "verification known bad nonce fails");
    });
  });
});

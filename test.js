var s = require("./index.js");
var test = require("tape");

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

#!/usr/bin/env node

// main file for doing scrypt hashcash
var s = require("./index.js");
var args = process.argv.slice(2);

if (args.length < 1 && args.length < 5) {
  usage();
} else {
  var verifyflag = args[0].indexOf("-v");
  var verifyflag = verifyflag == 0 || verifyflag == 1;
  var measureflag = args[0].indexOf("-m");
  var measureflag = measureflag == 0 || measureflag == 1;
  var bits = parseInt(args[1 + verifyflag]) == args[1 + verifyflag] ? parseInt(args[1 + verifyflag]) : null;
  if (args.length == 2 && !verifyflag && bits) {
    s.pow(args[0], s.target(bits)).then(function(found) {
      console.log(args[0] + ":" + s.toHex(found.nonce));
    });
  } else if (args.length == 1 && measureflag) {
    s.measure().then(function(h) {
      console.log((Math.round(h * 100) / 100) + " hashes per second");
    });
  } else if (verifyflag && bits && args.length > 2 && args.length < 5) {
    if (args.length == 3) {
      var parts = args[1].split(":");
      if (parts.length >= 2) {
        var nonce = parts.pop();
        var find = parts.join(":");
      } else {
        var nonce = null;
        var find = null;
      }
    } else {
      var nonce = args[2];
      var find = args[1];
    }
    if (nonce && find) {
      s.verify(find, s.fromHex(nonce), s.target(bits)).then(function(v) {
        if (v.verified) {
          // console.log("Verfied " + find + " with nonce " + nonce + " and hash " + v.hash);
          console.log("Verified: " + s.toHex(v.hash));
        } else {
          console.error("Verification failed! Hash does not have " + bits + " zero bits for this nonce.");
          process.exit(2);
        }
      });
    } else {
      usage();
    }
  } else {
    usage();
  }
  
}

function usage() {
  console.error("usage: script-hashcash [--verify|-v] TEXT[:NONCE] BITS");
  console.error("usage: script-hashcash -m");
  console.error();
  console.error("  TEXT       the text to be hashed against when searching for PoW.");
  console.error("  NONCE      nonce found previously, required when verifying.");
  console.error("  BITS       the number of bits of leading zeroes to search for (difficulty).");
  console.error("  --verify   check a previously discovered nonce.");
  console.error("  --measure  measure hashes-per-second capability of current device");
  console.error();
  console.error("Examples:");
  console.error("scrypt-hashcash 0:030626:adam@cypherspace.org 4");
  console.error("scrypt-hashcash --verify 0:030626:adam@cypherspace.org:54c89d7ab2dc9190 4");
  console.error("scrypt-hashcash --measure");
  process.exit(1);
}

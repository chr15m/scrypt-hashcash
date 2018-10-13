Scrypt hashcash implementation for node & browsers.

```shell
npm i scrypt-hashcash
```

```javascript
sh = require("scrypt-hashcash");
```

# API

### sh.pow(`text, target, [noncefunction, callback]`)

Generate a proof-of-work token over some text for a given target difficulty.

 * `text` is the material to be hashed over.
 * `target` is the difficulty vector to try to outperform (use `sh.target(bits)` to generate a target vector for a particular difficulty of `bits` zero-bits.
 * `noncefunction` is an optional callback function to return nonces which takes a single argument `i` being the number of iterations so far.
 * `callback` is an optional callback for when the promise API is not used.

```javascript
sh.pow("some text", sh.target(4)).then(function(pow) {
  console.log("Nonce found:", sh.toHex(pow.nonce));
  console.log("Resulting hash:", sh.toHex(pow.hash));
  console.log("Iterations it took:", pow.iterations);
});
```

### sh.verify(`text, nonce, target, [callback]`)

Verify some previously found nonce hashes to a lower value than the target difficulty specified.

 * `text` is the material which was hashed to find the nonce.
 * `nonce` is the nonce which the client claims to have found to beat the target.
 * `target` is the difficult vector to be verfied has having been exceeded.
 * `callback` is an optional callback for when the promise API is not used.

```javascript
sh.verify(text, nonce, target).then(function(v) {
  if (v.verified) {
    console.log("verification passed with hash " + sh.toHex(v.hash));
  } else {
    console.log("verification failed for this nonce");
  }
});
```

### sh.target(`bits`)

Generate a target vector for a particular number of zero-bits.

 * `bits` is the number of zero-bits of difficulty required.

```javascript
> sh.target(4);
Uint8Array [ 15, 255, 255, 255, 255, 255, 255, 255 ]
```

### sh.difficulty(`hashrate, time`)

Calculate how many bits of difficulty are required on average to run at a particular hashrate for a particular time.

 * `hashrate` is the hashrate expected.
 * `time` is the amount of time (e.g. seconds).

```javascript
> s.difficulty(100, 10)
9
```

### sh.measure()

Measure the number of hashes per second the current device can perform.

 * `iterations` is an optional number of iterations to carry out (defaults to 50).

```
s.measure().then(function(d) {
  console.log(d + " hashes per second");
})
```

### sh.toHex(`h`)

Convenience function to convert an array to a hex string representation.

### sh.fromHex(`h`)

Convenience function to convert a hex string to a `Uint8Array`.

### sh.config

The `scrypt` configuration being used. Parameters include `dkLen`, `N`, `r`, and `p`. See [the Scrypt Wikipedia page](https://en.wikipedia.org/wiki/Scrypt#Algorithm) for a summary of these variables and [this blog post](https://blog.filippo.io/the-scrypt-parameters/) for a treatment of how to tune them for different uses.

# Command line usage

You can use `scrypt-hashcash` from the command line.

For example, to find a collision of 4 bits against the test vector:

```shell
$ scrypt-hashcash 0:030626:adam@cypherspace.org 4
0:030626:adam@cypherspace.org:8043dfc5850f9525
```

Then to verify the nonce that was found and get the hash:

```shell
$ scrypt-hashcash --verify 0:030626:adam@cypherspace.org:213dc824e7eed707 4
Verified: 0120e170dead0aab
```

Test a bad nonce:

```shell
$ scrypt-hashcash --verify 0:030626:adam@cypherspace.org:213dc824e7eed709 4
Verification failed! Hash does not have sufficient zero bits for this nonce.
$ echo $?
2
```

Measure the hashes per second of the current device:

```shell
$ scrypt-hashcash --measure
79.18 hashes per second
```

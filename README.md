Scrypt hashcash implementation for node & browsers.

```shell
npm i scrypt-hashcash
```

### API



### Command line usage

You can use `scrypt-hashcash` from the command line.

For example, to find a collision of 4 bits against the test vector:

```
$ scrypt-hashcash 0:030626:adam@cypherspace.org 4
0:030626:adam@cypherspace.org:8043dfc5850f9525
```

The first part is the hashcash token which you can use for verification.

Then to verify the nonce that was found and get the hash:

```
$ scrypt-hashcash --verify 0:030626:adam@cypherspace.org:213dc824e7eed707 4
Verified: 0120e170dead0aab
```

Test a bad nonce:

```
$ scrypt-hashcash --verify 0:030626:adam@cypherspace.org:213dc824e7eed709 4
Verification failed! Hash does not have sufficient zero bits for this nonce.
$ echo $?
2
```

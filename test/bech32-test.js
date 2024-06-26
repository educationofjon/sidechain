// Parts of this software are based on "bech32".
// https://github.com/sipa/bech32
//
// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('bsert');
const Address = require('../lib/primitives/address');

// see https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki
// for test vectors, they include both the valid and invalid addresses

const validAddresses = [
  [
    'sc1qkjfls0y0rgnclld2k5shr7jxyd6trs43yeat37',
    Buffer.from([
    0x00, 0x14, 0xb4, 0x93, 0xf8, 0x3c, 0x8f, 0x1a, 0x27, 0x8f, 0xfd,
    0xaa, 0xb5, 0x21, 0x71, 0xfa, 0x46, 0x23, 0x74, 0xb1, 0xc2, 0xb1
  ])
  ],
  [
    'scrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kfrckyg',
    Buffer.from([
      0x00, 0x14, 0x75, 0x1e, 0x76, 0xe8, 0x19, 0x91, 0x96, 0xd4, 0x54, 0x94,
      0x1c, 0x45, 0xd1, 0xb3, 0xa3, 0x23, 0xf1, 0x43, 0x3b, 0xd6
    ])
   ],
];

const invalidAddresses = [
  // invalid hrp
  'tc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty',
  // invalid checksum
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5',
  // invalid witness version
  'BC13W508D6QEJXTDG4Y5R3ZARVARY0C5XW7KN40WF2',
  // invalid program length
  'bc1rw5uspcuh',
  // invalid program length
  'bc10w508d6qejxtdg4y5r3zarvary0c5xw7kw508d'
  + '6qejxtdg4y5r3zarvary0c5xw7kw5rljs90',
  // invalid program length for witness version 0
  'BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P',
  // mixed case
  'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sL5k7',
  // zero padding of more than 4 bits
  'tb1pw508d6qejxtdg4y5r3zarqfsj6c3',
  // non zero padding in 8 to 5 conversion
  'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3pjxtptv',
  // empty data section
  'bc1gmk9yu'
];

function createProgram(version, program) {
  const data = Buffer.allocUnsafe(2 + program.length);
  data[0] = version ? version + 0x50 : 0;
  data[1] = program.length;
  program.copy(data, 2);
  return data;
}

describe('Bech32', function() {
  for (const [addr, script] of validAddresses) {
    it(`should have valid address for ${addr}`, () => {
      let ret = null;
      let network = null;

      try {
        network = 'main';
        ret = Address.fromBech32(addr, network);
      } catch (e) {
        ret = null;
      }

      if (ret === null) {
        try {
          network = 'regtest';
          ret = Address.fromBech32(addr, network);
        } catch (e) {
          ret = null;
        }
      }

      assert(ret !== null);

      const output = createProgram(ret.version, ret.hash);
      assert.bufferEqual(output, script);

      const recreate = ret.toBech32(network);
      assert.strictEqual(recreate, addr.toLowerCase());
    });
  }

  for (const addr of invalidAddresses) {
    it(`should have invalid address for ${addr}`, () => {
      assert.throws(() => Address.fromBech32(addr, 'main'));
      assert.throws(() => Address.fromBech32(addr, 'regtest'));
    });
  }
});

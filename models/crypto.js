/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Sodium crypto model;                                                                        */
/*                                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const sodium = require('libsodium-wrappers');

class Crypto {

  /**
   * Generates a keypair
   *
   * @returns {Object} Sodium keypair.
   */
  static async genKeyPair() {
  await sodium.ready;

  return sodium.crypto_box_keypair();
  }

}

module.exports = Crypto;

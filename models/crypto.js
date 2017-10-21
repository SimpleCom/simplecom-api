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

    const keyPair = sodium.crypto_box_keypair();

    return keyPair;
  }

}

module.exports = Crypto;

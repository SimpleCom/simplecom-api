/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Sodium crypto model;                                                                        */
/*                                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const rsa = require('node-rsa');

class Crypto {

  /**
   * Generates a keypair
   *
   * @returns {Object} NodeRSA keypair.
   */
  static genKeyPair() {
    const key = new rsa();

    return key.generateKeyPair();
  }

  /**
   * Exports public key
   *
   * @returns {Object} NodeRSA public key.
   */
  static getPublicKey(key) {
    return key.exportKey('public');
  }

  /**
   * Exports private key
   *
   * @returns {Object} NodeRSA private key.
   */
  static getPrivateKey(key) {
    return key.exportKey('private');
  }

}

module.exports = Crypto;

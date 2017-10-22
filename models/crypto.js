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
   * @param {Object} key - NodeRSA keypair
   * @returns {Object} NodeRSA public key.
   */
  static getPublicKey(key) {
    return key.exportKey('public');
  }

  /**
   * Exports private key
   *
   * @param {Object} key - NodeRSA keypair
   * @returns {Object} NodeRSA private key.
   */
  static getPrivateKey(key) {
    return key.exportKey('private');
  }

  /**
   * Decrypts using private key
   *
   * @param {Object} key - NodeRSA keypair
   * @param {buffer} buffer - data to be decrypted
   * @returns {Object} NodeRSA private key.
   */
   static rsaDecrypt(key, buffer) {
    return key.decrypt(buffer);
   }

}

module.exports = Crypto;

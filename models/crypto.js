/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* Sodium crypto model;                                                                        */
/*                                                                                                */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const rsa = require('node-rsa');
const fs = require('fs-extra');

class Crypto {

  /**
   * Generates a keypair
   *
   * @returns {Object} NodeRSA keypair.
   */
  static genKeyPair() {
    const key = new rsa();
    return key.generateKeyPair(); // This can take parameters to change key size.
                                  //key.generateKeyPair([bits], [exp]);  key.generateKeyPair(4096)
                                  // bits — {int} — key size in bits. 2048 by default.  
                                  // exp — {int} — public exponent. 65537 by default.

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

  /**
   * TODO: aesDecrypt(fs, pass)
   * Decrypts a stream using AES passphrase
   *
   * @param {Object} fs - filestream - file to decrypt
   * @param {string} pass - AES passphrase
   * @returns {Object} decrypted filestream
  */

  // Helpful link for decrypting file streams:
  // http://lollyrock.com/articles/nodejs-encryption/

}

module.exports = Crypto;

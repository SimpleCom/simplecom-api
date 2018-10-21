'use strict';

const rsa = require('node-rsa');
// const fs = require('fs-extra');
const JSEncrypt = require('node-jsencrypt');

// const forge = require('node-forge');
// forge.options.usePureJavaScript = true;

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


  // static async genKeyPairNew(ctx) {
  //   const rsa = forge.pki.rsa;
  //   const {privateKey, publicKey} = await new Promise((resolve, reject) => {
  //     rsa.generateKeyPair({bits: 2048, workers: 2}, function (err, keypair) {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(keypair);
  //       }
  //     });
  //   });
  //   ctx.body = {private: privateKey, 'public': publicKey};
  // }

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
   * @param {Object} privateKey - RSA private key
   * @param {buffer} buffer - data to be decrypted
   * @returns {Object} plaintext data
   */
  static rsaDecrypt(privateKey, buffer) {
    try {
      const jsEncrypt = new JSEncrypt();
      jsEncrypt.setPrivateKey(privateKey);
      return jsEncrypt.decrypt(buffer.toString());
    } catch (e) {
      console.log(e);
    }
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

'use strict';

const rsa = require('node-rsa');
// const fs = require('fs-extra');
const JSEncrypt = require('node-jsencrypt');
const CryptoJS = require("crypto-js");

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
  static rsaDecrypt(privateKey, fileContents) {
    try {
      const jsEncrypt = new JSEncrypt();
      jsEncrypt.setPrivateKey(privateKey);
      return jsEncrypt.decrypt(fileContents);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Decrypts a string using AES passphrase
   *
   * @param {string} key - AES passphrase
   * @param {string} fileContents - string to decrypt
   * @returns {Object} decrypted string
   */
  static aesDecrypt(key, fileContents){
    return CryptoJS.AES.decrypt(fileContents, key)
      .toString(CryptoJS.enc.Utf8);
  }

}

module.exports = Crypto;

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Route to handle authentication /auth element                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const jwt = require('jsonwebtoken'); // JSON Web Token implementation
const scrypt = require('scrypt');       // scrypt library
const randomstring = require('randomstring');

const User = require('../models/user.js');

/**
 * @api {get} /auth Get JWT authentication token for subsequent API requests
 * @apiName   GetAuth
 * @apiGroup  Auth
 *
 * @apiDescription Subsequent requests requiring authentication are made with the JSON Web Token
 *   obtained from /auth, supplied in the Bearer Authorization HTTP header.
 *
 *   Note that since this does a KDF verification, it is a *slow* operation. The returned token has a
 *   24-hour limited lifetime.
 *
 * @apiParam   username                  Email of user to be authenticated.
 * @apiParam   password                  Password of user to be authenticated.
 * @apiHeader  [Accept=application/json] application/json, application/xml, text/yaml, text/plain.
 * @apiSuccess jwt                       JSON Web Token be used for subsequent Authorization header
 */

router.post('/auth', async function getAuth(ctx) {
  let user = null;
  if (ctx.request.body.refreshToken) {
    [user] = await User.getByToken(ctx.request.body.refreshToken);
    if (!user) {
      [user] = await User.getBy('refreshToken', ctx.request.body.refreshToken);
      if (!user) ctx.throw(401, 'Bad Token not found');
    }
  } else {
    [user] = await User.getBy('email', ctx.request.body.email);
    if (!user) ctx.throw(401, 'Username/password not found');
    //console.log('user', user);
    //console.log('test', user);
    // check password
    try {
      const match = await scrypt.verifyKdf(Buffer.from(user.password, 'base64'), ctx.request.body.password);
      //console.log('test', match);
      if (!match) ctx.throw(401, 'Username/password not found.');
    } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
      //ctx.throw(404, e.message);
      ctx.throw(401, 'Username/password not found!');
    }
  }

  try {
    const payload = {
      id: user.id,                 // to get user details
      role: user.role, // make role available without db query
    };
    //console.log('env', process.env.TOKEN_TIME);
    const token = jwt.sign(payload, process.env.JWT_KEY, {expiresIn: process.env.TOKEN_TIME});
    const refreshToken = randomstring.generate(50);
    const decoded = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
    const ret = User.addToken(user.id, refreshToken);

    ctx.body = {
      jwt: token,
      root: 'Auth',
      role: user.role,
      refreshToken: refreshToken,
      expires: decoded.exp,
    };
  } catch (e) { // e.g. "data is not a valid scrypt-encrypted block"
    ctx.throw(404, e.message);
    //ctx.throw(404, 'Username/password not found!');
  }
});

router.get('/user/code/:code', User.validateCode); //Validate a team code
router.post('/user/register', User.register);

router.get('/jwt', async function getJWT(ctx) {
  if (!ctx.header.authorization) ctx.throw(401, 'Authorisation required');
  const [scheme, token] = ctx.header.authorization.split(' ');
  if (scheme != 'Bearer') ctx.throw(401, 'Invalid authorisation');

  const roles = {1: 'user', 2: 'admin', 3: 'su'};

  try {
    const payload = jwt.verify(token, process.env.JWT_KEY); // throws on invalid token
    // valid token: accept it...
    ctx.state.user = payload;                  // for user id  to look up user details
    ctx.state.user.Role = roles[payload.role]; // for authorisation checks

    const curDate = new Date() / 1000;
    ctx.state.user.curDate = curDate;
    const seconds = Math.round(ctx.state.user.exp - curDate);
    ctx.state.user.remainingSeconds = Math.round(seconds);
    ctx.state.user.remainingMinutes = Math.round(seconds / 60);
    ctx.state.user.remainingHours = Math.round(seconds / 60 / 60);

    ctx.body = ctx.state.user;
    ctx.root = 'TOKEN';
  } catch (e) {
    if (e.message == 'invalid token') ctx.throw(401, 'Invalid JWT'); // Unauthorized
    ctx.throw(e.status || 500, e.message); // Internal Server Error
  }
});



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();

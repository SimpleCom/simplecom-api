/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const user  = require('../models/user.js');

router.delete('/user/:userID', user.deleteUser);       // delete a user
router.get('/user/getall', user.getAll);        // get all users
router.get('/user/getroles', user.getRoles);    // get all user roles
router.get('/user/getteams', user.getTeams);    // get all user roles
router.put('/user/save/:userID', user.save);    // update a user
router.post('/user/addTeam', user.addTeam);    // update a user

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();

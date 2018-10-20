/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const router = require('koa-router')(); // router middleware for koa
const user = require('../models/user.js');

router.prefix('/user/');

//router.delete('/user/:userID', user.deleteUser);       // delete a user
router.get('/:userID', user.getUser);
router.get('/list', user.getList);        // get all users
router.post('/register', user.register);
router.put('/', user.update);    // update a user
router.put('/status', user.setStatus);    // update a user

//router.get('/user/getroles', user.getRoles);    // get all user roles
//router.get('/user/getteams', user.getTeams);    // get all user roles
//router.post('/user/addTeam', user.addTeam);    // update a user
//router.get('/user/:userID/logo', user.getLogo);
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();

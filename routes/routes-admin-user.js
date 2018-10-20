/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

const router = require('koa-router')(); // router middleware for koa
const user = require('../models/user.js');


router.prefix('/user');

router.get('/list', user.getList);       // get all users
router.get('/types', user.getUserTypes); // get all userTypes
router.get('/:userID', user.getUser);    // get one user

router.post('/register', user.register); // add a user

router.put('/:userID', user.update);     // update a user
router.put('/:userID/status', user.setStatus);   // update a user status

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();

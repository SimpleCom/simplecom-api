/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  User routes                                                                                  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

'use strict';

const router = require('koa-router')(); // router middleware for koa
const list = require('../models/list.js');

router.prefix('/lists');
router.get('/', list.getListsWithContacts);
router.post('/', list.createList);
router.get('/:listID', list.getListDetails);
router.put('/:listID', list.updateList);
router.delete('/:listID', list.deleteList);
router.get('/:listID/contacts', list.getContacts);
router.post('/:listID/contacts', list.addContact);
router.put('/:listID/contacts/:contactID', list.updateContact);
router.delete('/:listID/contacts/:contactID', list.deleteContact);

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

module.exports = router.middleware();

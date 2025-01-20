const express = require('express');
const router = express.Router();
const layDownGroupsController = require('../controllers/layDownGroupsController');

router.post('/:playerId/init', layDownGroupsController.initialize);

module.exports = router;
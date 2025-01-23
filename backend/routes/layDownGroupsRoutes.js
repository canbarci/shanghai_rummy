const express = require('express');
const router = express.Router();
const layDownGroupsController = require('../controllers/layDownGroupsController');

router.post('/:playerId/init', layDownGroupsController.initialize);
router.post('/:playerId/update', layDownGroupsController.update);

module.exports = router;
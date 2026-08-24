const express = require('express');
const { handleAskQuestion } = require('../controllers/ask');

const router = express.Router();

router.post('/', handleAskQuestion);

module.exports = router;

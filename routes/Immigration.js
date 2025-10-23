var express = require('express');
var router = express.Router();

router.get('/Immigration', (req, res) => {
    res.sendFile('Immigration.html', {root: './public'});
});

module.exports = router;
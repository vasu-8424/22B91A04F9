const express = require('express')
const {createShortUrl, redirect, stats} = require('../controllers/shorturl')
const r = express.Router()
r.post('/shorturls', createShortUrl)
r.get('/shorturls/:shortcode', stats)
r.get('/:shortcode', redirect)
module.exports = r 
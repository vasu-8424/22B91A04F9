const mongoose = require('mongoose')

const clickSchema = new mongoose.Schema({
    time: Date,
    referrer: String,
    ip: String
})

const shortUrlSchema = new mongoose.Schema({
    shortcode: {type: String, unique: true, required: true},
    original: {type: String, required: true},
    created: {type: Date, default: Date.now},
    expiry: {type: Date, required: true},
    clicks: {type: Number, default: 0},
    clickLogs: [clickSchema]
})

shortUrlSchema.index({expiry: 1}, {expireAfterSeconds: 0})

module.exports = mongoose.model('ShortUrl', shortUrlSchema) 
const ShortUrl = require('../models/ShortUrl')
const {logEvent, log} = require('../../logging-middleware/log')
const crypto = require('crypto')

function validUrl(url) {
    return /^https?:\/\/.+\..+/.test(url)
}

async function createShortUrl(req, res) {
    let {original, shortcode, expiry} = req.body
    
    // Middleware validation logging
    if(!original) {
        await log("backend", "error", "middleware", "missing required field: original")
        return res.status(400).json({error: 'missing required field: original'})
    }
    
    if(!validUrl(original)) {
        await log("backend", "warn", "middleware", `invalid url format: ${original}`)
        return res.status(400).json({error: 'invalid url'})
    }
    
    await log("backend", "info", "middleware", "URL validation passed")
    
    if(!expiry) expiry = new Date(Date.now() + 30*60*1000)
    else expiry = new Date(expiry)
    
    if(!shortcode) {
        shortcode = crypto.randomBytes(3).toString('base64url')
        await log("backend", "info", "service", `auto-generated shortcode: ${shortcode}`)
    } else {
        await log("backend", "info", "service", `using custom shortcode: ${shortcode}`)
    }
    
    await log("backend", "debug", "service", `DB lookup starting for shortcode: ${shortcode}`)
    let exists = await ShortUrl.findOne({shortcode})
    await log("backend", "info", "service", `DB lookup completed for: ${shortcode}`)
    
    if(exists) {
        await log("backend", "warn", "handler", `shortcode already taken: ${shortcode}`)
        return res.status(409).json({error: 'shortcode taken'})
    }
    
    await log("backend", "debug", "service", `creating new URL document for: ${shortcode}`)
    let doc = await ShortUrl.create({shortcode, original, expiry})
    await log("backend", "info", "service", `URL document created successfully: ${shortcode}`)
    
    logEvent('Created ' + shortcode)
    await log("backend", "info", "handler", `short URL created: ${shortcode} -> ${original}`)
    
    res.status(201).json({shortcode, original, expiry: doc.expiry, created: doc.created})
}

async function redirect(req, res) {
    let {shortcode} = req.params
    
    await log("backend", "debug", "service", `DB lookup starting for redirect: ${shortcode}`)
    let doc = await ShortUrl.findOne({shortcode})
    await log("backend", "info", "service", `DB lookup completed for redirect: ${shortcode}`)
    
    if(!doc) {
        await log("backend", "warn", "handler", `shortcode not found: ${shortcode}`)
        return res.status(404).json({error: 'not found'})
    }
    
    if(doc.expiry < new Date()) {
        await log("backend", "warn", "handler", `shortcode expired: ${shortcode}`)
        await log("backend", "info", "service", `expired URL access attempt: ${shortcode} (expired: ${doc.expiry})`)
        return res.status(410).json({error: 'expired'})
    }
    
    await log("backend", "debug", "service", `updating click stats for: ${shortcode}`)
    doc.clicks++
    doc.clickLogs.push({time: new Date(), referrer: req.headers['referer'] || '', ip: req.ip})
    await doc.save()
    await log("backend", "info", "service", `click stats updated for: ${shortcode} (total clicks: ${doc.clicks})`)
    
    logEvent('Redirect ' + shortcode)
    await log("backend", "info", "handler", `successful redirect: ${shortcode} -> ${doc.original}`)
    
    res.redirect(307, doc.original)
}

async function stats(req, res) {
    let {shortcode} = req.params
    
    await log("backend", "debug", "service", `DB lookup starting for stats: ${shortcode}`)
    let doc = await ShortUrl.findOne({shortcode})
    await log("backend", "info", "service", `DB lookup completed for stats: ${shortcode}`)
    
    if(!doc) {
        await log("backend", "warn", "handler", `stats requested for non-existent shortcode: ${shortcode}`)
        return res.status(404).json({error: 'not found'})
    }
    
    await log("backend", "info", "handler", `stats retrieved for: ${shortcode} (clicks: ${doc.clicks})`)
    res.json({
        shortcode: doc.shortcode,
        original: doc.original,
        created: doc.created,
        expiry: doc.expiry,
        clicks: doc.clicks,
        clickLogs: doc.clickLogs
    })
}

module.exports = {createShortUrl, redirect, stats} 
const fs = require('fs')
const path = require('path')

function logEvent(msg) {
    try {
        const logPath = path.join(__dirname, '..', 'events.log')
        const line = new Date().toISOString() + ' ' + msg + '\n'
        
        const logDir = path.dirname(logPath)
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }
        
        fs.appendFileSync(logPath, line)
        console.log(`Logged: ${msg}`)
    } catch (error) {
        console.error('Logging error:', error.message)
        console.log(`Console log: ${msg}`)
    }
}

async function log(context, level, package, message) {
    const timestamp = new Date().toISOString()
    const logEntry = `${timestamp} [${context.toUpperCase()}] [${level.toUpperCase()}] [${package}] ${message}`
    
    try {
        const logPath = path.join(__dirname, '..', 'events.log')
        const line = logEntry + '\n'
        
        const logDir = path.dirname(logPath)
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true })
        }
        
        fs.appendFileSync(logPath, line)
        
        const colors = {
            debug: '\x1b[36m',    // Cyan
            info: '\x1b[32m',     // Green
            warn: '\x1b[33m',     // Yellow
            error: '\x1b[31m',    // Red
            fatal: '\x1b[35m'     // Magenta
        }
        const resetColor = '\x1b[0m'
        const color = colors[level.toLowerCase()] || colors.info
        
        console.log(`${color}${logEntry}${resetColor}`)
    } catch (error) {
        console.error('Enhanced logging error:', error.message)
        console.log(`Console log: ${logEntry}`)
    }
}

function requestLogger(req, res, next) {
    const requestLog = req.method + ' ' + req.originalUrl + ' ' + req.ip
    logEvent(requestLog)
    
    res.on('finish', () => {
        if(res.statusCode >= 400) {
            const errorLog = 'Error ' + res.statusCode + ' ' + req.method + ' ' + req.originalUrl
            logEvent(errorLog)
        } else {
            console.log(`${res.statusCode} ${req.method} ${req.originalUrl}`)
        }
    })
    next()
}

module.exports = requestLogger
module.exports.logEvent = logEvent
module.exports.log = log 
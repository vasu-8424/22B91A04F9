require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const shortUrlRoutes = require('./routes/shorturl')
const log = require('../logging-middleware/log')

const app = express()
app.use(cors())
app.use(express.json())
app.use(log)
app.use('/', shortUrlRoutes)

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log(' MongoDB connected successfully')
    
    const startServer = (port) => {
        const server = app.listen(port, () => {
            console.log(` Server is running on port ${port}`)
            console.log(' Application started successfully')
            console.log(` Access your application at: http://localhost:${port}`)
        })
        
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`  Port ${port} is already in use, trying port ${port + 1}...`)
                startServer(port + 1)
            } else {
                console.error(' Server error:', error.message)
                process.exit(1)
            }
        })
    }
    
    const port = process.env.PORT || 3000
    startServer(port)
    
})
.catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
}) 
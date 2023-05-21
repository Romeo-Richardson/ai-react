const mongoose = require('mongoose')

const historySchema = mongoose.Schema({
    username: {
        type: String
    },
    history: {
        type: Array
    },
    password: {
        type: String
    }
})

const historyModel = mongoose.model('histories', historySchema)

module.exports = historyModel
const express = require('express');
const mongoose = require('mongoose')
const gtts = require('node-gtts')('en');
const app = express();
app.use(express.json())
const cors = require('cors')
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions))

const historyModel = require('./models/history')

mongoose.connect('mongodb+srv://ZirrKing:65937675299041230290728123677583@cluster0.5r4pdz7.mongodb.net/aigod?retryWrites=true&w=majority')

app.get('/getHistory', async (req, res) => {
    const history = await historyModel.find()
    res.json(history)
})

app.get('/speech', function (req, res) {
    res.set({ 'Content-Type': 'audio/mpeg' });
    gtts.stream(req.query.text).pipe(res);
})

app.post('/postUser', async (req, res) => {
    const user = req.body
    const newUser = new historyModel(user)
    await newUser.save()
    res.json(newUser)
})

app.put('/postHistory', async (req, res) => {
    const id = req.body._id
    const newHistory = req.body.history
    try {
        const getHistory = await  historyModel.findById(id)
        console.log(getHistory)
        getHistory.history = newHistory
        await getHistory.save()
        res.status(200).json(getHistory)
    } catch (error) {
        console.log(error)
        console.log(req.body)
    }
})

app.listen(3001, () => {
    console.log('server running on port 3001')
})

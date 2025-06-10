const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const authRouter = require('./routes/authRoutes')
const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter);

mongoose.connect('mongodb://127.0.0.1:27017/securisee')
.then(() => console.log('connected to mongodb'))
.catch((error) => console.error('failed to connect to mongodb', error))


const port = 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
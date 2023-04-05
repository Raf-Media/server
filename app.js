const { default: axios } = require('axios')
const express = require('express')
const app = express()
const port = 3000
const jwt = require('jsonwebtoken');
const { compareSync } = require('bcrypt');
const SECRET_KEY = "titusherd"


app.use(express.urlencoded({ extended: false }))
const { User } = require("./models")
const midtransClient = require("midtrans-client")
// const { Association } = require('sequelize')



app.get('/', (req, res) => {
    res.send('Hello World!')
})

// async function authentication(req, res, next) {
//     try {
//         const { access_token } = req.headers
//         console.log(access_token);
//         if (!access_token) {
//             throw { name: "Invalid token" }
//         }

//         const payload = jwt.verify(access_token, SECRET_KEY)
//         // console.log(payload)
//         // res.send(payload)
//         // console.log(payload);

//         const user = await User.findByPk(payload.id)
//         // console.log(user);
//         if (!user) {
//             throw { name: "invalidtoken" }
//         }

//         req.user = {
//             id: user.id,
//             email: user.email
//         }

//         next()

//         // const user = await User.findByPk(payload.id)

//     } catch (error) {
//         if (error.name === "Invalid token") {
//             res.status(401).json({ message: "Invalid token" })
//         }
//     }
// }


app.get('/headline', async (req, res) => {
    // res.send('Hello World!')
    try {
        let { data } = await axios({
            method: "GET",
            url: "https://newsapi.org/v2/top-headlines?sources=bbc-news&apiKey=78bf80ad77d64bfcba750098341e7c9d"
        })
        res.status(200).json({ data })
    } catch (error) {
        console.log(error);
    }
})

app.post('/register', async (req, res) => {
    try {
        let { email, password } = req.body
        let newUser = await User.create({ email, password })
        res.status(200).json(newUser)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({
            where: { email }
        })

        // console.log(user);

        const check = compareSync(password, user.password)
        // console.log(check);

        // if (!check) {
        //     throw { name: "Invalid User" }
        // }

        const payload = {
            id: user.id
        }

        // console.log(payload);

        const access_token = jwt.sign(payload, SECRET_KEY)
        console.log(access_token);

        res.status(200).send({ access_token })

    } catch (error) {
        // console.log(error);
        if (error.name === "Invalid User") {
            res.json({ message: "User Not Found" })
        } else {
            res
                .status(500)
                .json({ message: "Internal Server Error" })
        }
    }
})


app.post('/generate-midtrans-token',  async (req, res, next) => {
    // const midtransClient = require('midtrans-client');
    // Create Snap API instance
    const findUser = await User.findByPk(req.user.id)

    if (findUser.isSubscribed) {
        throw { name: "already_subscribed" }
    }

    let snap = new midtransClient.Snap({
        // Set to true if you want Production Environment (accept real transaction).
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY
    });

    let parameter = {
        transaction_details: {
            order_id: "TRANSACTION_" + Math.floor(900000 + Math.random() * 900000), //must be unique
            gross_amount: 10000
        },
        credit_card: {
            secure: true
        },
        customer_details: {
            email: findUser.email,
        }
    };

    const midTransToken = await snap.createTransaction(parameter)
    console.log(midTransToken);


})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
let express = require('express')
let router = express.Router()
let userController = require('../controllers/users')
let { RegisterValidator, ChangePasswordValidator, validatedResult } = require('../utils/validator')
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')
const { checkLogin } = require('../utils/authHandler')

const privateKey = fs.readFileSync(path.join(__dirname, '../keys/private.key'), 'utf8')

router.post('/register', RegisterValidator, validatedResult, async function (req, res, next) {
    let { username, password, email } = req.body;
    let newUser = await userController.CreateAnUser(
        username, password, email, '69b2763ce64fe93ca6985b56'
    )
    res.send(newUser)
})

router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let user = await userController.FindUserByUsername(username);

    if (!user) {
        return res.status(404).send({
            message: "thong tin dang nhap khong dung"
        })
    }

    if (!user.lockTime || user.lockTime < Date.now()) {
        if (bcrypt.compareSync(password, user.password)) {
            user.loginCount = 0;
            await user.save();

            let token = jwt.sign(
                {
                    id: user._id,
                },
                privateKey,
                {
                    algorithm: 'RS256',
                    expiresIn: '1h'
                }
            )

            return res.send(token)
        } else {
            user.loginCount++;
            if (user.loginCount == 3) {
                user.loginCount = 0;
                user.lockTime = new Date(Date.now() + 60 * 60 * 1000)
            }
            await user.save();
            return res.status(404).send({
                message: "thong tin dang nhap khong dung"
            })
        }
    } else {
        return res.status(404).send({
            message: "user dang bi ban"
        })
    }
})

router.get('/me', checkLogin, function (req, res, next) {
    res.send(req.user)
})

router.post('/change-password', checkLogin, ChangePasswordValidator, validatedResult, async function (req, res, next) {
    try {
        let { oldpassword, newpassword } = req.body;
        let user = req.user;

        if (!bcrypt.compareSync(oldpassword, user.password)) {
            return res.status(400).send({
                message: "oldpassword khong dung"
            })
        }

        if (oldpassword === newpassword) {
            return res.status(400).send({
                message: "newpassword khong duoc trung oldpassword"
            })
        }

        user.password = newpassword;
        await user.save();

        return res.send({
            message: "doi mat khau thanh cong"
        })
    } catch (error) {
        return res.status(500).send({
            message: error.message
        })
    }
})

module.exports = router;
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');
const passwordValidator = require('password-validator');
const sanitize = require('mongo-sanitize')
require('dotenv').config()

let schema = new passwordValidator();
schema
    .is().min(8)                                    // Minimum length 8
    .is().max(20)                                   // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(2)                                // Must have at least 2 digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

exports.signup = (req, res, next) => {
    const email = sanitize(req.body.email)
    const password = sanitize(req.body.password)
    // email and password syntax validation
    if (!emailValidator.validate(email)) {
        return res.status(401).json({ message: 'Invalid email and/or password' });
    }
    if (!schema.validate(password)) {
        return res.status(401).json({ message: 'Invalid email and/or password' });
    }
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash
            })
            user.save()
                .then(() => res.status(201).json({ message: 'User created' }))
                .catch(error => res.status(500).json({ error }))
        })
        .catch(error => res.status(500).json({ error }))
}

exports.login = (req, res, next) => {
    const email = sanitize(req.body.email)
    User.findOne({ email: email })
        .then(user => {
            if (user === null) {
                res.status(401).json({ message: 'Incorrect username/password pair' })
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({ message: 'Incorrect username/password pair' })
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    process.env.RANDOM_TOKEN_SECRET,
                                    { expiresIn: process.env.EXPIRES }
                                )
                            })
                        }
                    })
                    .catch(error => res.status(500).json({ error }))
            }
        })
        .catch(error => res.status(500).json({ error }))
}
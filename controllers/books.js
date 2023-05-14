const Mongoose = require('mongoose');
const fs = require('fs');
const mongoSanitize = require('mongo-sanitize');
const Book = require('../models/Book');


exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }))
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(400).json({ error }))
};

exports.getBestRating = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }))
};

exports.createBook = (req, res, next) => {
    if (!req.file) {
        return res.status(417).json({ message: 'Image file is missing' })
    }
    // sanitizing form datas
    let bookObject = mongoSanitize(req.body.book);
    bookObject = JSON.parse(bookObject);
    //deleting ids
    delete bookObject._id;
    delete bookObject._userId;
    //preparing book
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    //saving book
    book.save()
        .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
        .catch(error => {
            res.status(400).json({ error })
        });
};

exports.modifyBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                return res.status(403).json({ message: 'Not authorized' });
            } else {
                //creating object which will be saved further
                let bookObject = req.file ? {
                    ...JSON.parse(mongoSanitize(req.body.book)),
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                } : { ...mongoSanitize(req.body) }
                delete bookObject.userId;

                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => {
                        //as everything is alright, deleting old image if there's a new one 
                        if (req.file) {
                            // deleting old image file if new file added
                            const imagePath = `./images/${book.imageUrl.split('/').pop()}`;
                            fs.unlink(imagePath, (err) => {
                                if (err) {
                                    console.error(err);
                                }
                            });
                        }
                        //then send res
                        res.status(200).json({ message: 'Book modified' })
                    })
                    .catch(error => res.status(400).json({ error })
                    );
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.rateBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            //check if user already rated this book
            book.ratings.map(rate => {
                if (req.auth.userId === rate.userId) {
                    res.status(400).json({ message: "You already rated this book" })
                }
            })
            //push data into object
            const reqUserId = req.auth.userId;
            book.ratings.push({
                "userId": req.auth.userId,
                "grade": req.body.rating
            });
            // Updating average
            let sum = 0;
            book.ratings.map(rate => sum += rate.grade);
            book.averageRating = sum / book.ratings.length;
            // Updating DB
            Book.updateOne({ _id: req.params.id }, book)
                .then(() => { res.status(201).json(book) })
                .catch((error) => { res.status(401).json({ error }) });
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};




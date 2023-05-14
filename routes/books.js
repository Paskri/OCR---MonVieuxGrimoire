const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const multer = require('../middleware/multer-config')
const sharp = require('../middleware/sharp-config')
const booksCtrl = require('../controllers/books')

router.get('/', booksCtrl.getAllBooks);

router.get('/bestrating', booksCtrl.getBestRating)

router.get('/:id', booksCtrl.getOneBook)

router.post('/', auth, multer, sharp, booksCtrl.createBook)

router.put('/:id', auth, multer, sharp, booksCtrl.modifyBook)

router.delete('/:id', auth, booksCtrl.deleteBook)

router.post('/:id/rating', auth, multer, booksCtrl.rateBook)

module.exports = router 
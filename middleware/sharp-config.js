const sharp = require('sharp');
const fs = require('fs');
const path = require('path')

module.exports = (req, res, next) => {
    if (req.file) {
        const { buffer, originalname } = req.file;
        const fileDatas = path.parse(originalname);
        const link = fileDatas.name.split(' ').join('_') + Date.now() + '.webp';
        fs.mkdir('./images', (err) => {
            if (err && err.code !== 'EEXIST') {
                console.error(err);
                return res.status(500).json({ error: 'Unable to create image directory' });
            }
            sharp(buffer)
                .webp({ quality: 20 })
                .toFile(`./images/${link}`, (error) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).json({ error: 'Unable to save image' });
                    } else {
                        req.file.filename = link;
                    }
                    next();
                });
        });
    } else {
        next();
    }
};
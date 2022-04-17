const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const { Post, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: 'ap-northeast-2',
});
const upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: 'nodebird96',
    key(req, file, cb) {
      cb(null, `original/${Date.now()}${path.basename(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file); // 업로드한 결과물이 req.file에 저장됨
  res.json({ url, originalUrl });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all( // 모든 엘리먼트 순서대로 promise 실행
        hashtags.map(tag => { // 매 엘리먼트마다
          return Hashtag.findOrCreate({ // DB에 입력한 hashtag가 있으면 조회 없으면 생성
            where: { title: tag.slice(1).toLowerCase() }, // 앞에 #을 제거하고 소문자로 변환
          })
        }),
      );
      console.log(result);
      await post.addHashtags(result.map(r => r[0])); // 2차원 배열에서 각 엘리먼트마다는 1차원이고 0번 인덱스를 가져와서 addHashtags
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
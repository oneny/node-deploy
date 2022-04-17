const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

router.use((req, res, next) => { // 템플릿 엔진 변수 설정
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user ? req.user.Followings.map(f => f.id) : [];
  next();
});

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird' });
});

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입 - NodeBird' });
});

router.get('/', async (req, res, next) => {
  try {
    // SELECT posts.*, users.id, users.nick FROM posts LEFT OUTER JOIN users ON posts.UserId = users.id AND (users.deletedAt is null) ORDER BY posts.createdAt DESC
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// GET /hashtag?hashtag=express
router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag; // express
  if (!query) { // 검색단어가 없으면 메인 페이지 이동
    return res.redirect('/');
  }
  try {
    // 해시태그가 존재하는지 찾기
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    console.log(hashtag);
    let posts = [];
    if (hashtag) { // 검색단어가 있다면
      // express라는 해시태그에 딸려있는 Posts들을 가져옴 + 게시글의 작성자까지 가져옴
      posts = await hashtag.getPosts({ includes: [{ model: User, attributes: ['id', 'nick'] }] });
    }

    console.log(posts);
    return res.render('main', {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
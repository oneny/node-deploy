const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const helmet = require('helmet');
const hpp = require('hpp');
const redis = require('redis');
let RedisStore = require('connect-redis')(session);

dotenv.config(); // .env 파일에 접근 가능
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD,
  legacyMode: true, // connect-redis와 node-redis 모듈 간의 호환되지 않은 문제 해결
});
redisClient.connect().catch(console.error);

const pageRouter = require('./routes/page'); // 라우터 추가
const authRouter = require('./routes/auth');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');
const { sequelize } = require('./models'); // 시퀄라이즈 가져오기
const passportConfig = require('./passport');
const logger = require('./logger');

const app = express();
passportConfig();
app.set('port', process.env.PORT || 8001); // 개발할 때는 .dot에 추가해서 포트 버놓 바꾸기
app.set('view engine', 'html'); // 템플릿 엔진(넌적스) 형식 지정
// app.enable('trust proxy');
nunjucks.configure('views', { // 템플릿 실행 폴더 views
  express: app,
  watch: true,
});
sequelize.sync({ force: false })
  .then(() => {
    console.log('데이터베이스 연결 성공');
  })
  .catch((err) => {
    console.error(err);
  });

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false
    }));
  app.use(hpp());
} else {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 접근
app.use('/img', express.static(path.join(__dirname, 'uploads'))); // /img 요청온 것 uploads에서 정적파일 찾음
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
const sessionOption = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
  store: new RedisStore({ client: redisClient }),
};
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // proxy 서버를 둔다면 배포할 때 같이 설정하면 좋음 1-> true
  // sessionOption.cookie.secure = true;  
}
app.use(session(sessionOption));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter); // / 요청시 pageRouter에 설정된 라우터 중 하나로 요청
app.use('/auth', authRouter); // /auth 요청시 authRouter에 설정된 라우터 중 하나로 요청
app.use('/post', postRouter); // /post 요청시 postRouter에 설정된 라우터 중 하나로 요청
app.use('/user', userRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다`);
  error.status = 404;
  logger.info('hello');
  logger.error(error.message);
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.stage || 500);
  res.render('error');
});

module.exports = app;
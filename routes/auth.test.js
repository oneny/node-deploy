const request = require('supertest');
const { sequelize } = require('../models');
const app = require('../app'); // app.listen을 분리했기 때문에 실제 서버가 실행되지 않음

beforeAll(async () => { // 아래 라우터 테스트가 실행되기 전에
  await sequelize.sync(); // 테이블 생성
});

describe('POST /join', () => { // 회원가입 검사
  test('로그인 안 했으면 가입', (done) => {
    request(app)
      .post('/auth/join')
      .send({
        email: 'oneny@oneny.com',
        nick: 'oneny',
        password: 'nodejs'
      })
      .expect('Location', '/')
      .expect(302, done);
      // 가입 성공하면 res.redirect('/'); 하기때문에 위 expect는 가입 성공을 의미
  });
});

describe('POST /login', () => { // beforeEach가 적용된 로그인 검사
  const agent = request.agent(app);
  beforeEach((done) => { // beforeEach로 test에서 로그인 상태로 만들어줌
    agent
      .post('/auth/login')
      .send({
        email: 'oneny@oneny.com',
        password: 'nodejs',
      })
      .end(done);
  });

  test('이미 로그인했는데 가입하면 redirect /', (done) => {
    const message = encodeURIComponent('로그인한 상태입니다');
    agent
      .post('/auth/join')
      .send({
        email: 'oneny@oneny.com',
        nick: 'oneny',
        password: 'oneny'
      })
      .expect('Location', `/?error=${message}`)
      .expect(302, done);
  })
});

describe('POST /login', () => { // beforeEach가 안들어간 로그인 검사
  test('가입되지 않은 회원', (done) => {
    // localStrategy.js의 done(null, false, { message: '가입되지 않은 회원입니다.'});
    const message = encodeURIComponent('가입되지 않은 회원입니다.');
    request(app)
      .post('/auth/login')
      .send({
        email: 'oneny22@oneny.com',
        password: 'nodejs',
      })
      .expect('Location', `/?loginError=${message}`)
      .expect(302, done);
      // auth.js의 // return res.redirect(`/?loginError=${info.message}`);
  })
  test('로그인 수행', (done) => {
    request(app) // supertest 안에 app을 넣어줌
      .post('/auth/login') // app 라우터에서 POST /auth/login 요청하는 것처럼 실행
      .send({
        email: 'oneny@oneny.com',
        password: 'nodejs',
      })
      .expect('Location', '/')
      .expect(302, done);
      // res.redirect('/'); 302 Location -> '/'이라는 의미
      // 위의 코드로 테스트 확인
  });

  test('비밀번호 틀림', (done) => {
    const message = encodeURIComponent('비밀번호가 일치하지 않습니다.');
    request(app)
      .post('/auth/login')
      .send({
        email: 'oneny@oneny.com',
        password: 'wrong',
      })
      .expect('Location', `/?loginError=${message}`)
      .expect(302, done);
  });
});

describe('GET logout', () => {
  test('로그인 되어있지 않으면 403', (done) => {
    request(app)
      .get('/auth/logout')
      .expect(403, done); // middlewares.js 내의 res.status(403).send('로그인 필요')
  });

  // 로그아웃을 검사하려면 로그인이 되어있어야 함
  const agent = request.agent(app); // 여러 테스트에 걸쳐서 그 상태가 계속 유지됨
  beforeEach((done) => { // 테스트하기 전에 실행
    agent
      .post('/auth/login')
      .send({
        email: 'oneny@oneny.com',
        password: 'nodejs',
      })
      .end(done);
  });

  test('로그아웃 수행', (done) => {
    const message = encodeURIComponent('비밀번호가 일치하지 않습니다.');
    agent
      .get('/auth/logout')
      .expect('Location', '/')
      .expect(302, done);
  });
});

afterAll(async () => {
  await sequelize.sync({ force: true });
});
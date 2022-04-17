const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

describe('isLoggedIn', () => {
  const res = {
    status: jest.fn(() => res), // res를 반환해야 다시 res를 체이닝할 수 있음
    send: jest.fn(), // 리턴하는 것이 없으면 그냥 jest.fn()만 작성
  };
  const next = jest.fn();

  test('로그인되어 있으면 isLoggedIn이 next를 호출해야 함', () => {
    const req = {
      isAuthenticated: jest.fn(() => true), // req.isAuthenticated: true
    };
    isLoggedIn(req, res, next); // true로 next 호출
    expect(next).toBeCalledTimes(1); // 가짜 next가 몇 번 호출되는지 검사 1번이면 통과
  });
  
  test('로그인되어 있지 않으면 isLoggedIn이 에러를 응답해야 함', () => {
    const req = {
      isAuthenticated: jest.fn(() => false),
    };
    isLoggedIn(req, res, next);
    expect(res.status).toBeCalledWith(403);
    expect(res.send).toBeCalledWith('로그인 필요');
  });
});

describe('isNotLoggedIn', () => {
  const res = {
    redirect: jest.fn(),
  }
  const next = jest.fn();
  test('로그인되어 있으면 isNotLoggedIn이 에러를 응답해야 함', () => {
    const req = {
      isAuthenticated: jest.fn(() => true), // true 반환
    };
    isNotLoggedIn(req, res, next);
    const message = encodeURIComponent('로그인한 상태입니다');
    expect(res.redirect).toBeCalledWith(`/?error=${message}`);
  });

  test('로그인되어 있지 않으면 isNotLoggedIn이 next를 호출해야 함',() => {
    const req = {
      isAuthenticated: jest.fn(() => false),
    };
    isNotLoggedIn(req, res, next);
    expect(next).toBeCalledTimes(1);
  });
});
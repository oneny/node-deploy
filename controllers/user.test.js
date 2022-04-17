jest.mock('../models/user'); // 아래 require('../models/user'); 코드보다 위에 있어야 함
const User = require('../models/user');
const { addFollowing } = require('./user');

describe('addFollowing', () => {
  const req = {
    user: { id: 1 }, // req.user.id
    params: { id: 2}, // req.params.id
  };
  const res = {
    status: jest.fn(() => res), // 메서드 체이닝이므로 res를 반환해야 함
    send: jest.fn(),
  };
  const next = jest.fn();

  test('사용자를 찾아 팔로잉을 추가하고 success를 응답해야 함', async () => {
    User.findOne.mockReturnValue(Promise.resolve({
      id: 1,
      name: 'oneny',
      addFollowings(value) {
        return Promise.resolve(true);
      },
    }));
    // controllers/user.js에서 6번째 줄이 실행되면 users는 항상 { id: 1, name: 'oneny' }를 가지는 객체가 됨
    await addFollowing(req, res, next);
    expect(res.send).toBeCalledWith('success');
  });

  test('사용자를 못찾으면 res.status(404).send(no user)를 호출함', async () => {
    User.findOne.mockReturnValue(Promise.resolve(null));
    await addFollowing(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.send).toBeCalledWith('no user');
  });

  test('DB에서 에러가 발생하면 next(error) 호출함', async () => {
    const error = '테스트용 에러';
    User.findOne.mockReturnValue(Promise.reject(error));
    await addFollowing(req, res, next);
    expect(next).toBeCalledWith(error);
  });
});
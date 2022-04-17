const User = require('../models/user');

exports.addFollowing = async (req, res, next) => {
  try {
    // 나에 대한 객체를 찾음
    const user = await User.findOne({ where: {id: req.user.id }});
    if (user) {
      // 내가 1번 사용자를 팔로잉
      await user.addFollowings([parseInt(req.params.id, 10)]);
      // = await user.addFollowings([parseInt(req.params.id, 10)]);
      res.send('success');
    } else {
      res.status(404).send('no user');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
}
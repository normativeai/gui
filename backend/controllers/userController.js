var passport = require('../config/passport');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var User = require('../models/user');

exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
			return next(err);
		}
    if (!user) {
			return res.status(400).send([user, info])
		}
		req.logIn(user, function(err) {
			res.send("Logged in")
		})
  })(req, res, next);
};

exports.logout = function(req, res, next) {
  req.logout();

  return res.status(200).send('Logged out.');
};

exports.authMiddleware = (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
};

exports.user = function(req, res, next) {
  User.findById(req.session.passport.user).populate('queries').exec(function(err, user) {
    console.log([user, req.session])
    res.send({ user: user })
  })
};

exports.create = [
  body('email', 'email required').isLength({ min: 1 }).trim(),
  body('password', 'password required').isLength({ min: 1 }).trim(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
    }).then(user => res.json(user));

  }
];




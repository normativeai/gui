var Query = require('../models/query');
var User= require('../models/user');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.create = [
  body('name', 'Query name required').isLength({ min: 1 }).trim(),
  sanitizeBody('name').trim().escape(),

  function(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    Query.create({
      _id: req.body._id,
      name: req.body.name,
      lastUpdate: new Date(),
      user: req.user,
      theory: req.body.theory,
      description: req.body.description,
      assumptions: req.body.assumptions,
      goal: req.body.goal
    }).then(query => {
      User.findById(req.user._id, function(err, user) {
        user.queries.push(query._id);
        user.save(err => {
          if (err) {
            res.status(400).json({ err: err});
          } else {
            res.status(201).json({"data": query});
          }
      })})});
  }
]

exports.get = function(req, res, next) {
  Query.find({ "user": req.user }, ['_id', 'lastUpdate', 'name', 'description', 'assumptions', 'goal'], {"sort": {"_id": 1}}, function (err, queries) {
    res.json({"data": queries})
  });
};

exports.getOne = function(req, res, next) {
  Query.findById(req.params.queryId, ['_id', 'lastUpdate', 'name', 'description', 'assumptions', 'goal'])
    .populate('theory', ['_id', 'lastUpdate', 'name', 'description'])
    .exec(function(err, query) {
      res.json({"data": query});
    });
};

exports.update = function(req, res, next) {
  var body = req.body;
  body.lastUpdate = new Date();
  Query.updateOne({ '_id': req.params.queryId, user: req.user._id }, { $set: body}, function (err, result) {
    if (!err && (result.nModified > 0)) {
      res.status(200).json({"message": 'Query updated'});
    } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
      res.status(404).json({err: 'Query could not be found'});
    } else {
      res.status(400).json({'err': err});
    }
  });
};

exports.delete = function(req, res, next) {
  Query.deleteOne({ '_id': req.params.queryId, user: req.user._id }, function (err, result) {
    if (!err && (result.n > 0)) {
      res.status(200).json({"message": 'Query deleted'});
    } else if ((result && result.nModified < 1) || (err && err.name == 'CastError')) {
      res.status(404).json({err: 'Query could not be found'});
    } else {
      res.status(400).json({'err': err});
    }
  });
};

// Execute query.
exports.exec = function(req, res) {
  Query.findOne({"_id": req.params.queryId})
    .populate('theory')
    .exec(function(err, query) {
      if (query) {
        query.execQuery(function(theorem, proof, error) {
          if (theorem) {
            res.json({"data": {"result":theorem, "proof":proof}});
          } else if (error) {
            res.status(400).json({err: error});
          } else {
            res.status(400).json({err: 'MleanCoP error: invalid query'});
          }
        });
      } else {
        res.status(400).json({err: 'Unknown query ID'});
      }
  });
};

exports.consistency = function(req, res, next) {
  Query.findById(req.params.queryId)
    .populate('theory')
    .exec(function(err, query) {
    if (query) {
      query.isConsistent(function(code, cons, err) {
        if (code == 1) { // mleancop ok
          if (cons) {
            res.status(200).json({data: {"consistent": true}});
          } else {
            res.status(200).json({data: {"consistent": false}});
          }
        } else { //mleancop error
          res.status(400).json({err: err});
        }
      })
    } else {
      res.status(404).json({err: "Cannot find query"});
    }
    });
};

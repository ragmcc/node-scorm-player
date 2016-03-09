var session = {};

session.checkToken = function(req, res, next, callback) {
	var token = req.query.token == undefined ? (req.params.token == undefined ? (req.body.token == undefined ? "" : req.body.token) : req.params.token) : req.query.token;

	var db = req.db;
	var collection = db.get('user');

	if( token.length > 0 ) {
		collection.findOne({'sessions.token': token}, [], function (e, doc) {
			if(doc != null) {
				var user_data = doc;
				user_data['id'] = doc['_id'];
                user_data['priority'] = doc['priority'];
				user_data['active_task'] = doc['active_task'];

				collection.update({'_id':user_data['id'], 'sessions.token': token}, {$set: {'sessions.$.updated_at': (new Date())}}, function(e, count) {
					if( !e ) {
						callback(req, res, next, user_data);
					} else {
						res.json({'success': false, 'error': {'code': 'DB100', 'reason': 'Error on query'}});
					}
				});
			} else {
				res.json({'success': false, 'error': {'code': 'U101', 'reason': '¡Invalid token!'}});
			}
		});
	} else {
		res.json({'success': false, 'error': {'code': 'U101', 'reason': '¡Invalid token!'}});
	}
};

module.exports = session;

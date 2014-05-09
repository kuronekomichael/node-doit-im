'use strict';
var request = require('request'),
	uuid = require('uuid');

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11B554a CaWebApp/1.0(amb4692512577uh;ja;2.3.1;)';


function DoItIm() {
	this.cookies = {};
	this.token = null;
}

DoItIm.prototype.signin = function(user, pass, cb) {
	var that = this;
	var callback = cb || function(){};

	request.get({
		method: 'POST',
		url: 'https://i.doit.im/signin',
		headers: {
			'User-Agent': UA
		},
		form: {
			username: user,
			password: pass,
			autologin: 1
		}
	}, function(err, res, body) {
		if (err) {
			callback(err);
			return;
		}
		if (res.statusCode !== 302) {
			callback(new Error('Invalid statusCode:' + res.statusCode));
			return;
		}
		if (res.headers.location !== '/home') {
			console.error(res, body);
			callback(new Error('Invalid redirect location:' + res.headers.location));
			return;
		}
		res.headers['set-cookie'].forEach(function(cookieStr) {

			var matched = cookieStr.match(/([^=]+)=([^;]+);/);
			if (!matched) {
				return;
			}
			that.cookies[matched[1]] = matched[2];
		});
		if (!that.cookies.autologin) {
			callback(new Error('token not found in cookies:' + res.headers['set-cookie']));
			return;
		}
		that.token = that.cookies.autologin;
		callback(err, that.token);
	});
};

DoItIm.prototype.signout = function(cb) {
	var that = this;
	var callback = cb || function(){};

	var cookie = '';
	for (var key in this.cookies) {
		cookie += (key + '=' + this.cookies[key] + '; ');
	}

	request.get({
		method: 'GET',
		url: 'https://i.doit.im/signout',
		headers: {
			'User-Agent': UA,
			'Cookie': cookie
		}
	}, function(err, res, body) {
		if (err) {
			callback(err);
			return;
		}
		if (res.statusCode !== 200) {
			callback(new Error('Invalid statusCode:' + res.statusCode));
			return;
		}
		var cookieStr = res.headers['set-cookie'][0];
		var matched = cookieStr.match(/([^=]+)=([^;]*);/);
		if (!matched) {
			callback(new Error('no cookie deleted:' + cookieStr));
			return;
		}
		that.cookies[matched[1]] = matched[2];

		if (!that.cookies.autologin) {
			that.token = null;
		}
		callback(err);
	});
};

// タスクの登録
DoItIm.prototype.registerTask = function(rawTask, cb) {
	var callback = cb || function(){};

	var cookie = '';
	for (var key in this.cookies) {
		cookie += (key + '=' + this.cookies[key] + '; ');
	}

	var task = rawTask;

	if (task.start_at instanceof Date) {
		task.start_at = task.start_at.getTime();
	}

	task.all_day = false;
	task.archived = 0;
	task.type = 'task';
	task.attribute = 'plan';
	task.completed = 0;
	task.deleted = 0;
	task.end_at = 0;
	task.context = null;
	task.forwarded_by = null;
	task.repeater = null;
	task.priority = 0;
	task.project = null;
	task.tags = [];
	task.trashed = 0;
	task.reminders.forEach(function(reminder){
		reminder.view = 'relative';
		if (reminder.time instanceof Date) {
			reminder.time = reminder.time.getTime();
		}
	});
	task.created = task.updated = new Date().getTime();
	task.pos = 0;
	task.uuid = uuid.v4();

	request.get({
		method: 'POST',
		url: 'https://i.doit.im/api/tasks/create',
		headers: {
			'User-Agent': UA,
			'X-Requested-With': 'XMLHttpRequest',
			'Cookie': cookie
		},
		json: true,
		body: task
	}, function(err, res, body) {
		if (err) {
			callback(err);
			return;
		}
		if (res.statusCode !== 200) {
			callback(new Error('Invalid statusCode:' + res.statusCode));
			return;
		}
		callback(err);
	});
};

module.exports = DoItIm;
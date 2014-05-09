var expect = require('chai').expect;
var sinon = require("sinon");
var request = require('request');
var DoItIm = require('../lib/doit-im');
var moment = require('moment');

var UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Mobile/11B554a CaWebApp/1.0(amb4692512577uh;ja;2.3.1;)';

function stubSigninOK(stub) {
	stub.yields(null, {statusCode:302, headers: {
		'set-cookie': [
			'i18next=ja; Domain=.doit.im; Path=/',
			'PLAY_LANG=ja; Domain=.doit.im; Path=/',
			'autologin=fdd6k3if3-dd81-4040-bddf-4c05171cf909; Max-Age=2592000; Domain=.doit.im; Path=/; Expires=Sun, 08 Jun 2014 09:24:14 GMT'
		],
		'location': '/home'
	}});
	return stub;
}

function stubSigninNG(stub) {
	stub.yields(null, {statusCode:200, headers: {
		'set-cookie': [
			'i18next=ja; Domain=.doit.im; Path=/',
			'PLAY_LANG=ja; Domain=.doit.im; Path=/',
			'autologin=fdd6k3if3-dd81-4040-bddf-4c05171cf909; Max-Age=2592000; Domain=.doit.im; Path=/; Expires=Sun, 08 Jun 2014 09:24:14 GMT'
		],
		'location': '/home'
	}});
	return stub;
}

describe('Authorization', function() {

	afterEach(function() {
		request.get.restore();
	});

	it('Signin', function(done) {

		stubSigninOK(sinon.stub(request, 'get'));

		var doItIm = new DoItIm();
		doItIm.signin('test', 'tttest', function(err, token) {
			expect(err).to.not.exist;
			expect(token).is.ok;
			expect(token).equals('fdd6k3if3-dd81-4040-bddf-4c05171cf909');

			expect(request.get.calledOnce).be.equal(true);

			var opt = request.get.getCall(0).args[0];
			expect(opt.url).equals('https://i.doit.im/signin');
			expect(opt.method).equals('POST');
			expect(opt.headers['User-Agent']).to.be.equal(UA);
			expect(opt.form['username']).to.be.equal('test');
			expect(opt.form['password']).to.be.equal('tttest');
			expect(opt.form['autologin']).to.be.equal(1);

			expect(doItIm.cookies.i18next).to.be.equal('ja');
			expect(doItIm.cookies.PLAY_LANG).to.be.equal('ja');
			expect(doItIm.cookies.autologin).to.be.equal('fdd6k3if3-dd81-4040-bddf-4c05171cf909');

			done();
		});
	});

	it('Cannot Signin', function(done) {

		stubSigninNG(sinon.stub(request, 'get'));

		var doItIm = new DoItIm();
		doItIm.signin('test', 'tttest2', function(err, token) {
			expect(err).to.exist;
			expect(token).is.empty;
			done();
		});
	});

	it('Blank Signin', function() {

		stubSigninOK(sinon.stub(request, 'get'));

		var doItIm = new DoItIm();
		doItIm.signin('test', 'tttest2');
	});

	it('Signout', function(done) {

		var doItIm = new DoItIm();

		sinon
			.stub(request, 'get')
			.onCall(0)
			.yields(null, {statusCode:302, headers: {
				'set-cookie': [
					'i18next=ja; Domain=.doit.im; Path=/',
					'PLAY_LANG=ja; Domain=.doit.im; Path=/',
					'autologin=fdd6k3if3-dd81-4040-bddf-4c05171cf909; Max-Age=2592000; Domain=.doit.im; Path=/; Expires=Sun, 08 Jun 2014 09:24:14 GMT'
				],
				'location': '/home'
			}})
			.onCall(1)
			.yields(null, {statusCode:200, headers: {
				'set-cookie': ['autologin=; Domain=.doit.im; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT']
			}});

		doItIm.signin('test', 'tttest', function(err, token) {
			expect(err).to.not.exist;
			expect(token).equals('fdd6k3if3-dd81-4040-bddf-4c05171cf909');

			doItIm.signout(function(err, token) {
				expect(err).to.not.exist;
				expect(token).is.empty;

				expect(request.get.calledTwice).be.equal(true);

				var opt = request.get.getCall(1).args[0];
				expect(opt.url).equals('https://i.doit.im/signout');
				expect(opt.method).equals('GET');
				expect(opt.headers['User-Agent']).to.be.equal(UA);

				var cookieStr = opt.headers['Cookie'] || '';
				var cookieObj = {};
				cookieStr.split(';').map(function(d){ return d.replace(/(?:^\s|\s$)/g, ''); }).filter(function(d){ return d; }).forEach(function(line) {
					var splits = line.split('=');
					cookieObj[splits[0]] = splits[1];
				});
				var actual = {
					autologin: 'fdd6k3if3-dd81-4040-bddf-4c05171cf909',
					PLAY_LANG: 'ja',
					i18next: 'ja'
				};
				expect(cookieObj).to.be.deep.equal(actual);

				expect(doItIm.cookies.autologin).to.be.equal('');
				expect(doItIm.token).to.be.null;

				done();
			});
		});
	});
});

describe('Task Management', function() {

	afterEach(function() {
		request.get.restore();
	});

	it('Register', function(done) {

		sinon
			.stub(request, 'get')
			.onCall(0)
			.yields(null, {statusCode:302, headers: {
				'set-cookie': [
					'i18next=ja; Domain=.doit.im; Path=/',
					'PLAY_LANG=ja; Domain=.doit.im; Path=/',
					'autologin=fdd6k3if3-dd81-4040-bddf-4c05171cf909; Max-Age=2592000; Domain=.doit.im; Path=/; Expires=Sun, 08 Jun 2014 09:24:14 GMT'
				],
				'location': '/home'
			}})
			.onCall(1)
			.yields(null, {statusCode:200});

		var doItIm = new DoItIm();
		var date = new Date(2014, 5-1, 9, 23, 55);
		var remind = moment(date).subtract(10, 'minute').toDate();

		var task = {
			title: 'サンプルる',
			notes: 'メモ\nめも',
			reminders: [
				{mode:'popup', time:remind},
				{mode:'email', time:remind}
			],
			start_at: date
		};

		doItIm.signin('test', 'tttest', function(err, token) {
			expect(err).to.not.exist;
			expect(token).equals('fdd6k3if3-dd81-4040-bddf-4c05171cf909');

			doItIm.registerTask(task, function(err) {
				expect(err).to.not.exist;

				expect(request.get.calledTwice).be.equal(true);

				var opt = request.get.getCall(1).args[0];
				expect(opt.url).equals('https://i.doit.im/api/tasks/create');
				expect(opt.method).equals('POST');
				expect(opt.headers['User-Agent']).to.be.equal(UA);
				expect(opt.headers['X-Requested-With']).to.be.equal('XMLHttpRequest');

				var cookieStr = opt.headers['Cookie'] || '';
				var cookieObj = {};
				cookieStr.split(';').map(function(d){ return d.replace(/(?:^\s|\s$)/g, ''); }).filter(function(d){ return d; }).forEach(function(line) {
					var splits = line.split('=');
					cookieObj[splits[0]] = splits[1];
				});
				var actual = {
					autologin: 'fdd6k3if3-dd81-4040-bddf-4c05171cf909',
					PLAY_LANG: 'ja',
					i18next: 'ja'
				};
				expect(cookieObj).to.be.deep.equal(actual);

				done();
			});
		});
	});
});

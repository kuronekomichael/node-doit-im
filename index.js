var DoItIm = require('./lib/doit-im'),
	moment = require('moment');

var client = new DoItIm();

var user = '<your-doit.im-mailaddress>';
var pass = '<oyur-doit.im-password>';

client.signin(user, pass, function(err, token) {
	if (err) {
		console.error('singup error', err);
		return;
	}
	console.log('> singup complete', token);

	var date = new Date(2014, 5-1, 9, 23, 55);
	var remind = moment(date).subtract(10, 'minute').toDate();

	var task = {
		title: 'Sample Title',
		notes: 'memo\nMEMO',
		reminders: [
			{mode:'popup', time:remind},
			{mode:'email', time:remind}
		],
		start_at: date
	};
	client.registerTask(task, function(err) {
		if (err) {
			console.error('registerTask error', err);
			return;
		}
		console.log('> registerTask complete');

		client.signout(function(err) {
			if (err) {
				console.error('signout error', err);
				return;
			}
			console.log('> signout complete');
		});
	});
});

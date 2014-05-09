node-doit-im
============

"UNOFFICIAL" node.js library for http://doit.im/

## Features

- signup
- register task
- signout

## Getting Started

```
npm install doit-im
```

### example:

```
var DoItIm = require('doit-im');
var client = new DoItIm();

client.signin('<your-doit.im-mailaddress>', '<oyur-doit.im-password>', function(err, token) {

	client.registerTask({
		title: 'Sample Title',
		notes: 'memo',
		start_at: new Date().getTime() + 30 * 60 * 1000,	// start 30min. later
		reminders: [
			{mode:'popup', time:new Date().getTime() + 25 * 60 * 1000} // remind before 5min.
		]
	});
});
```

## API

### client.signin('doit.im-mail', 'doit.im-password', function callback(){..})

signup for http://doit.im.  
callback format: `callback(err, token)`

### client.signout(function callback(){..})

signout for http://doit.im

### client.registerTask(task, function callback(){..})

register new task.

#### task format:

```
{
    title: 'task title',             // task title
    notes: 'task notes',             // task notes
    start_at: 1399649571978,         // task start time absolutely
    reminders: [
        {
            mode: 'popup' or 'mail', // reminder's type
            time: 1399649551978      // reminder's time absolutely
        }
    ]
}
```

## TODO

- validation
- read existing tasks
- modify existing tasks

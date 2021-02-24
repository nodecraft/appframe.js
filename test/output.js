'use strict';
const expect = require('unexpected');
const dayjs = require('dayjs');

const processVoid = require('process-void');
const spawnpoint = require.resolve('..');

const timeFormat = {
	format: '{date} {type}: {line}',
	time: "HH:mm",
	date: "dddd, MMMM DD YYYY"
};

const datePattern = /\[(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, (January ([0-2]\d|3[01])|February [0-2]\d|Ma(rch|y) ([0-2]\d|3[01])|April ([0-2]\d|30)|June ([0-2]\d|30)|July ([0-2]\d|3[01])|August ([0-2]\d|3[01])|(Sept|Nov)ember ([0-2]\d|30)|(Octo|Decem)ber ([0-2]\d|3[01])) \d{4}]/;

// resources for creating tests:
// https://sinonjs.org/
// https://github.com/elliotf/mocha-sinon
// https://github.com/mochajs/mocha/issues/1582


/**
 * Adds 1 minute to a buffered string (e.g. [13:37]) converted to Array
 * @param  {Array} time buffered string (e.g. [13:37]) converted to Array
 */
const subtractOneMinute = (time) => {
	const tCopy = time;
	console.log('t: ' + tCopy);
	tCopy[5]--;
	/**
	 * The two digit numbers here are hex number references to a Buffer
	 * hexes 48-57 correspond to 0-9 (as string characters)
	 * The first if loop should be read as:
	 * if(time[seconds] < 0){
	 *   time[seconds] = 9;
	 *   time[minutes]--;
	 *   ...
	*/
	if(tCopy[5] < 48){
		tCopy[5] = 57;
		tCopy[4]--;
		if(tCopy[4] < 48){
			tCopy[4] = 53;
			tCopy[2]--;
			if(tCopy[2] < 48){
				tCopy[2] = 57;
				tCopy[1]--;
				if(tCopy[1] < 48){
					tCopy[1] = 50;
					tCopy[2] = 51;
				}
			}
		}
	}

	return tCopy;
};

/**
 * Checks time from test to currentTime generated by test
 * @param  {Buffer} data recieved from 'app.stdout.data'
 * @param  {String} time recieved from 'time = currentTime.format(timeFormat.time)'
 */
const reformTimeData = (data, time) => {
	time = '[' + time + ']';
	const dataTime = [...data].slice(0, 7);
	const remains = [...data].slice(7, [...data].length);

	if(Buffer.from(dataTime).toString() !== time){
		const newTime = subtractOneMinute(dataTime);
		const newTimeString = Buffer.from(newTime).toString();
		if(newTimeString !== time){
			return Buffer.from('Check reformTimeData(), result was: ' + Buffer.from([...newTime, ...remains]).toString());
		}
		return Buffer.from([...newTime, ...remains]);
	}
	return data;
};

describe('spawnpoint.debug', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, {'construct': true});
		void app.stdout.once('data', (data) => {
			expect(data, 'when decoded as', 'utf-8', 'to equal', 'Test\n');
			void app.done();
		});
		app.config.debug = true;
		void app.debug("Test");
	});
});

describe('spawnpoint.log', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, {'construct': true});
		app.stdout.once('data', (data) => {
			const currentTime = dayjs();
			if(datePattern.test(data)){
				const date = currentTime.format(timeFormat.date);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
				app.stdout.once('data', (data) => {
					const time = currentTime.format(timeFormat.time);
					data = reformTimeData(data, time);
					expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [LOG]: Test\n`);
					void app.done();
				});
			}else{
				const time = currentTime.format(timeFormat.time);
				data = reformTimeData(data, time);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [LOG]: Test\n`);
				void app.done();
			}
		});
		//app.send({"set": {'key': 'config.log', 'value': timeFormat}});
		app.config.log = timeFormat;
		//app.send({'command': 'log', args: ["Test"]});
		app.log("Test");
	});
});

describe('spawnpoint.info', () => {
	it('should output Test', (done) => {
		//const app = fork('./autoload-void', [''], { 'silent': true });
		const app = new processVoid(done, spawnpoint, {'construct': true});
		app.stdout.once('data', (data) => {
			const currentTime = dayjs();
			if(datePattern.test(data)){
				const date = currentTime.format(timeFormat.date);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
				app.stdout.once('data', (data) => {
					const time = currentTime.format(timeFormat.time);
					data = reformTimeData(data, time);
					expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [INFO]: Test\n`);
					void app.done();
				});
			}else{
				const time = currentTime.format(timeFormat.time);
				data = reformTimeData(data, time);
				expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [INFO]: Test\n`);
				void app.done();
			}
		});
		//app.send({"set": {'key': 'config.log', 'value': timeFormat}});
		app.config.log = timeFormat;
		app.info("Test");
		//app.send({'command': 'info', args: ["Test"]});
	});
});

describe('spawnpoint.warn', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, {'construct': true});
		const currentTime = dayjs();
		app.stdout.once('data', (data) => {
			const date = currentTime.format(timeFormat.date);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
		});
		app.stderr.once('data', (data) => {
			const time = currentTime.format(timeFormat.time);
			data = reformTimeData(data, time);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [WARN]: Test\n`);
			void app.done();
		});
		app.config.log = timeFormat;
		app.warn("Test");
	});
});

describe('spawnpoint.error', () => {
	it('should output Test', (done) => {
		const app = new processVoid(done, spawnpoint, {'construct': true});
		const currentTime = dayjs();
		app.stdout.once('data', (data) => {
			const date = currentTime.format(timeFormat.date);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${date}]\n`);
		});
		app.stderr.once('data', (data) => {
			const time = currentTime.format(timeFormat.time);
			data = reformTimeData(data, time);
			expect(data, 'when decoded as', 'utf-8', 'to equal', `[${time}] [ERROR]: Test\n`);
			void app.done();
		});
		app.config.log = timeFormat;
		app.error("Test");
	});
});
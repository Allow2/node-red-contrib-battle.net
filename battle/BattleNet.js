'use strict';

const async = require('async');
const request = require('request');
const cheerio = require('cheerio');

module.exports = function(RED) {

	function scheduleDecode(val) {
		var test2 = parseInt(val);
		var test = test2;
		var decoded = [];
		// lowest 24 bits
		for (var i = 47; i > 23; i--) {
			decoded[i] = test & 1;
			test = test >> 1;
		}
		// highest 24 bits
		test = ~~(test2 / 0x1000000);
		for (var i = 23; i > -1; i--) {
			decoded[i] = test & 1;
			test = test >> 1;
		}
		return decoded;
	}
	
	function scheduleEncode(decoded) {
		var val1 = 0;
		for (var i = 0; i < 24; i++) {
			val1 = val1 + (decoded[i] ? 1 : 0);
			val1 = val1 << 1;
		}
		var val2 = 0;
		for (var i = 24; i < 48; i++) {
			val2 = val2 + (decoded[i] ? 1 : 0);
			val2 = val2 << 1;
		}
		return val1 * 0x1000000 + val2;
	}
	
    function BattleNet(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        const key = this.credentials.key;
        const jar = request.jar();
        //node.nodeId = node.id.replace(/\./g, '_');
        
        node.csrfToken = null;

		// function csrf() {
// 			if (node.csrfToken) {
// 				return callback(null, node.csrfToken);
// 			}
// 			return callback(null);
// 		}
		
		function handleResponse(response, body, callback) {
			const $ = cheerio.load(body);
			node.csrfToken = $("#csrftoken").val() || node.csrfToken;
				
			//console.log($.html(), '\n\n\n********\n\n', body);
			// find the selected voiceChatStatus
			const listenAndSpeak = $("#voiceChatStatus1");
			const listenOnly = $("#voiceChatStatus2");
			const off = $("#voiceChatStatus3");
			const voiceChatStatus =
				listenAndSpeak.prop('checked') ? listenAndSpeak.val():
				listenOnly.prop('checked') ? listenOnly.val():
				off.val();
			
			var settings = {
				// defaults?
				enableAccountMuted: $("#enableAccountMuted").prop('checked'),
				enableRealId: $("#enableRealId").prop('checked'),
				enableProfile: $("#enableProfile").prop('checked'),
				enableGroups: $("#enableGroups").prop('checked'),
				enableFriendsOfFriends: $("#enableFriendsOfFriends").prop('checked'),
				enableForumPosting: $("#enableForumPosting").prop('checked'),
				voiceChatStatus: voiceChatStatus,
				timeZone: $("#timeZone").val(),
				enableWeeklyReport: $("#enableWeeklyReport").prop('checked'),
				dailyLimitEnabled: $("#dailyLimitEnabled").prop('checked'),
				dailyLimit: $("#dailyLimit").val(),
				weeklyLimitEnabled: $("#weeklyLimitEnabled").prop('checked'),
				weeklyLimit: $("#weeklyLimit").val(),
				scheduleEnabled: $("#scheduleEnabled").prop('checked'),
				scheduleMonday: scheduleDecode($('#scheduleMonday').val()),
				scheduleTuesday: scheduleDecode($('#scheduleTuesday').val()),
				scheduleWednesday: scheduleDecode($('#scheduleWednesday').val()),
				scheduleThursday: scheduleDecode($('#scheduleThursday').val()),
				scheduleFriday: scheduleDecode($('#scheduleFriday').val()),
				scheduleSaturday: scheduleDecode($('#scheduleSaturday').val()),
				scheduleSunday: scheduleDecode($('#scheduleSunday').val()),
				inGamePurchasesEnabled: $("#inGamePurchasesEnabled").prop('checked')
			};
			return callback(null, settings);
		}
		
		
        node.check = function(callback) {
        	request({
        		method: 'GET',
        		jar: jar,
				//preambleCRLF: true,
				//postambleCRLF: true,
				uri: 'https://us.battle.net/account/parental-controls/manage.html?key=' + key,
			}, function (error, response, body) {
				if (error) {
				  	console.error('get failed:', error);
				  	return callback(error);
				}
				
				const statusCode = (response && response.statusCode) || 555;
				if (statusCode !== 200) {
					console.error('get error:', statusCode);
				  	return callback(new Error('error ' + statusCode));
				}
				
				return handleResponse(response, body, callback);
			});
        };


		function _redirected(params, response, jar, callback) {
			// const form = Object.assign({}, params, {
//         		csrftoken: node.csrfToken,
//         		scheduleMonday: scheduleEncode(params.scheduleMonday),
// 				scheduleTuesday: scheduleEncode(params.scheduleTuesday),
// 				scheduleWednesday: scheduleEncode(params.scheduleWednesday),
// 				scheduleThursday: scheduleEncode(params.scheduleThursday),
// 				scheduleFriday: scheduleEncode(params.scheduleFriday),
// 				scheduleSaturday: scheduleEncode(params.scheduleSaturday),
// 				scheduleSunday: scheduleEncode(params.scheduleSunday)
//         	});
//         	console.log('\n\nform":', form, '\n\n');
        	request({
        		method: 'GET',
        		jar: jar,
				uri: response.headers.location,
			}, function (error, response, body) {
				if (error) {
				  	console.error('post failed:', error);
				  	return callback(error);
				}
				
				const statusCode = (response && response.statusCode) || 555;
				if (statusCode !== 200) {
					console.error('post error:', statusCode, response.headers);
				  	return callback(new Error('error ' + statusCode));
				}
				
				//console.log('redirect response: ', body);
				return handleResponse(response, body, callback);
			});
		}
		
		
		const boolParams = ['enableRealId',
				'enableProfile',
				'enableGroups',
				'enableFriendsOfFriends',
				'enableForumPosting',
				'enableWeeklyReport',
				'dailyLimitEnabled',
				'weeklyLimitEnabled',
				'scheduleEnabled',
				'inGamePurchasesEnabled'];
				
        node.set = function(params, callback) {
        	var formData = {
        		csrftoken: node.csrfToken,
				voiceChatStatus: params.voiceChatStatus,
				timeZone: params.timeZone,
				dailyLimit: params.dailyLimit,
				weeklyLimit: params.weeklyLimit,
				scheduleMonday: scheduleEncode(params.scheduleMonday),
				scheduleTuesday: scheduleEncode(params.scheduleTuesday),
				scheduleWednesday: scheduleEncode(params.scheduleWednesday),
				scheduleThursday: scheduleEncode(params.scheduleThursday),
				scheduleFriday: scheduleEncode(params.scheduleFriday),
				scheduleSaturday: scheduleEncode(params.scheduleSaturday),
				scheduleSunday: scheduleEncode(params.scheduleSunday)
			};
			boolParams.forEach(function(bool) {
				if (params[bool]) {
					formData[bool] = 'on';
				}
			});
        	console.log('\n\n formData:', formData, '\n\n');
        	
        	request({
        		method: 'POST',
        		formData: formData,
        		jar: jar,
				uri: 'https://us.battle.net/account/parental-controls/manage.html',
			}, function (error, response, body) {
				if (error) {
				  	console.error('post failed:', error);
				  	return callback(error);
				}
				
				const statusCode = (response && response.statusCode) || 555;
				if (statusCode === 302) {
					console.log('redirected:', statusCode, response.headers, jar);
					return _redirected(params, response, jar, callback);
				}
				
				if (statusCode !== 200) {
					console.error('post error:', statusCode, response.headers);
				  	return callback(new Error('error ' + statusCode));
				}
				
				return handleResponse(response, body, callback);
			});
        };

    }
    
    RED.nodes.registerType("BattleNet", BattleNet, {
        credentials: {
            key: { type:"password" }
        }
    });
};



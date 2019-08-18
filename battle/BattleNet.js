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
        //node.nodeId = node.id.replace(/\./g, '_');
        
        node.csrfToken = null;

		// function csrf() {
// 			if (node.csrfToken) {
// 				return callback(null, node.csrfToken);
// 			}
// 			return callback(null);
// 		}
		
        node.check = function(callback) {
        	request({
        		method: 'GET',
				//preambleCRLF: true,
				//postambleCRLF: true,
				uri: 'https://us.battle.net/account/parental-controls/manage.html?key=' + key,
			}, function (error, response, body) {
				if (error) {
				  	return console.error('get failed:', error);
				}
				const $ = cheerio.load(body);
				
				node.csrfToken = $("#csrftoken").val() || node.csrfToken;
				
				//console.log($.html(), '\n\n\n********\n\n', body);
				
				var settings = {
					// defaults?
					enableAccountMuted: $("#enableAccountMuted").prop('checked'),
					enableRealId: $("#enableRealId").prop('checked'),
					enableProfile: $("#enableProfile").prop('checked'),
					enableGroups: $("#enableGroups").prop('checked'),
					enableFriendsOfFriends: $("#enableFriendsOfFriends").prop('checked'),
					enableForumPosting: $("#enableForumPosting").prop('checked'),
					voiceChatStatus: $("#voiceChatStatus").val(),
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
			});
        };

        node.set = function(params, callback) {
        	const form = Object.assign({}, params, {
        		csrftoken: node.csrfToken,
        		scheduleMonday: scheduleEncode(params.scheduleMonday),
				scheduleTuesday: scheduleEncode(params.scheduleTuesday),
				scheduleWednesday: scheduleEncode(params.scheduleWednesday),
				scheduleThursday: scheduleEncode(params.scheduleThursday),
				scheduleFriday: scheduleEncode(params.scheduleFriday),
				scheduleSaturday: scheduleEncode(params.scheduleSaturday),
				scheduleSunday: scheduleEncode(params.scheduleSunday)
        	});
        	request({
        		method: 'POST',
        		form: form,
				uri: 'https://us.battle.net/account/parental-controls/manage.html',
			}, function (error, response, body) {
				if (error) {
				  	return console.error('post failed:', error);
				}
				
				// on success, re-read and return current settings
				const $ = cheerio.load(body);
				
				console.log('\n\n** POST RESPONSE **\n\n', body);
				
				var settings = {
					// defaults?
					enableAccountMuted: $("#enableAccountMuted").prop('checked'),
					enableRealId: $("#enableRealId").prop('checked'),
					enableProfile: $("#enableProfile").prop('checked'),
					enableGroups: $("#enableGroups").prop('checked'),
					enableFriendsOfFriends: $("#enableFriendsOfFriends").prop('checked'),
					enableForumPosting: $("#enableForumPosting").prop('checked'),
					voiceChatStatus: $("#voiceChatStatus").val(),
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
			});
        };

    }
    
    RED.nodes.registerType("BattleNet", BattleNet, {
        credentials: {
            key: { type:"password" }
        }
    });
};



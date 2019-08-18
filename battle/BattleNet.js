'use strict';

const async = require('async');
const request = require('request');


module.exports = function(RED) {

    function BattleNet(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const key = this.credentials.key;
        //node.nodeId = node.id.replace(/\./g, '_');
        
//         node.csrfToken = null;

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
				console.log('Get successful!  Server responded with:', body);
            	return callback(null);
			});
        };

        node.set = function(callback) {
        	console.log(key);
            return callback(null);
        };

    }
    
    RED.nodes.registerType("BattleNet", BattleNet, {
        credentials: {
            key: { type:"password" }
        }
    });
};



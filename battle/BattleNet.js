'use strict';

const async = require('async');

module.exports = function(RED) {

    function BattleNet(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const key = this.credentials.key;
        //node.nodeId = node.id.replace(/\./g, '_');

        node.check = function(callback) {
        	console.log(key);
            return callback(null);
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



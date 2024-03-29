const async = require('async');

module.exports = function(RED) {

    function BattleCheck(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node._battle = RED.nodes.getNode(config.battle);
        
        node.on('input', function(msg) {
			node.status({ fill:   'blue', shape:  'dot', text:   'checking...' });
            node._battle.check(function(err, settings) {
            	if (err) {
            		return node.status({ fill: 'red', shape: 'dot', text: err.message });
            	}
            	node.status({});
				msg.payload = settings;
            	node.send(msg);
			});
        });
    }
    RED.nodes.registerType('BattleCheck', BattleCheck);
};

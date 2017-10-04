module.exports = function(self, res) {
    let msg = res.params[0];
    self.emit('chat', msg);
};
module.exports = function(self, res) {
    if(res.result) {
        self.user = {
            id: res.result.id,
            name: res.result.name
        };
        self.emit('loggedIn', self.user);
        self.loggedIn = true;
    } else {
        console.log('!!! Auth failed !!!');
    }
};

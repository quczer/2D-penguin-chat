var fs = require('fs')
var sha256 = require('js-sha256').sha256;

class User {
    anon() {
        let ide = -Math.floor(Math.random()*1000000);
        return {
            id: ide,
            name: "guest" + ide,
            hash: null,
        };
    }
    get(name) {
        if (!fs.existsSync('data/user/'+name+'.json')) return null;
        var file = fs.readFileSync('data/user/'+name+'.json');
        var obj = JSON.parse(file);
        return obj;
    }
    create(name, password) {
        let user = {
            id: Math.floor(Math.random()*1000000),
            name: name,
            hash: sha256(password),
        };
        let j = JSON.stringify(user);
        fs.writeFileSync('data/user/'+user.name+'.json', j);
    }
    save(user) {
        var j = JSON.stringify(user);
        fs.writeFileSync('data/user/'+user.name+'.json', j);
    }
}

module.exports = new User();

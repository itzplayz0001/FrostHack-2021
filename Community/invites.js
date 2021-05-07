const fs = require('fs')

function createInvite(id, inviteid) {

    try {
        let obj = JSON.parse(fs.readFileSync("invites.json", "utf-8"))

        obj.communities[id].push({inviteID: `${inviteid}`})
        let result = JSON.stringify(obj)
        fs.writeFile("invites.json", result, (err) => {
            if (err) return false;

            return true;
        })
    } catch {
        return false;
    }
}

function validateInvite(id, inviteid) {
    let obj = JSON.parse(fs.readFileSync("invites.json", "utf-8"))

    obj["communities"][id].forEach(element => {
        if(element["inviteID"] == inviteid) {
            return true;
        } else {
            return false;
        }
    });
}

module.exports = {
    createInvite, validateInvite
}

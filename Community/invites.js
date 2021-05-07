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

/*
function validateInvite(id, inviteid) {
    console.log(id)
    console.log(inviteid)
    let obj = JSON.parse(fs.readFileSync("invites.json", "utf-8"))

    obj["communities"][id].forEach(element => {
        if(element["inviteID"] == inviteid) {
            return true;
        } else {
            return false;
        }
    });
}*/

function validateInvite(id, inviteId) {
    console.log(`Id: ${id} InviteID: ${inviteId}`);
  
    let invitesAsJSON = JSON.parse(fs.readFileSync("invites.json", "utf-8"));
  
    let validInvites = invitesAsJSON["communities"][id].find(e => e["inviteId"] === inviteId);
  
    let isValid = false;
  
    if(validInvites !== undefined) {
      isValid = true;
    }
  
    return isValid;
}

module.exports = {
    createInvite, validateInvite
}

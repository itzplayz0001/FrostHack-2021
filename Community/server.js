const express = require('express')
const app = express()
const fs = require('fs')

// CUSTOM
const social = require("./invites.js")

app.get('/invite/:community/:invite', (req, res) => {
    let com = req.params.community;
    let invite = req.params.invite;

    if (com.length > 12) {
        if (invite.length > 6) {
            
            // CHECK VALIDATION OF INVITE
            social.validateInvite(com, invite)
            if (social.validateInvite = true) {
                res.send('Valid!')
            } else {
                res.send('Invalid!')
            }


        } else {
            console.log('bad invite')
            //res.render('badInvite.ejs')
        }
    } else {
        console.log('bad community')
        //res.render('badInvite.ejs')
    }
})


let check = social.validateInvite('34534534528967', 'sudfisfgisgzdiu')
console.log(check)
/*if (check) {
    console.log('Valid')
} else {
    console.log('Invalid')
}*/

console.log('App listening on 5050')
app.listen('5050')

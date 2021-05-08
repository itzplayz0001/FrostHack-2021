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
            let validated = social.validateInvite(com, invite)
            if (validated = true) {
                res.send('Valid invite')
            } else {
                res.send('Invalid invite')
                //res.render('badInvite.ejs')
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

let valid = social.validateInvite('846593845734', '839758fsdfg')
console.log(valid)

console.log('App listening on 5050')
app.listen('5050')

var express = require('express');
var app = express();
var mysql = require('mysql');
var con = require('./connection');
const cookieParser = require('cookie-parser');
const e = require('express');
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'ejs');
app.use(cookieParser())

app.get('/', (req, res) => {
  let {email_id, password} = req.cookies;
  if(!email_id) return res.render('pages/register', { success: false, message: '' });
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}' AND users.email_id='${req.cookies.email_id}' UNION SELECT communities.comm_admin, users.name FROM communities INNER JOIN users ON users.name = communities.comm_admin WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let admin = false;
    if(typeof resd[0] == 'undefined') return res.render('pages/index', { status: '307', message: '', comm_name: '', name: '', admin: admin});
    if(resd[0].uname == resd[1].name) admin = true;
    if(req.cookies.comm_id){
      res.render('pages/index', { status: '200', message: '', comm_name: resd[0].name, name: resd[0].uname.split(' ')[0], admin: admin });
    }else{
      res.render('pages/index', { status: '307', message: '', comm_name: '', name: '', admin: admin});
    }
  })
});

app.use('/admin/', function (req, res, next) {
  con.query(`SELECT communities.comm_admin FROM communities INNER JOIN users ON users.name = comm_admin WHERE communities.comm_id='${req.cookies.comm_id}' AND users.user_id='${req.cookies.user_id}';`, (req, resd) => {
    if(resd.length < 1){
      return res.send('You are not a admin!')
    }else{
      next()
    }
  })
})

app.get('/admin', (req, res) => {
  let {email_id, password} = req.cookies;
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let comm_name = resd[0].name;
    if(req.cookies.comm_id){
      res.render('pages/admin', { status: '200', message: '', comm_name: resd[0].name, name: resd[0].uname});
    }else{
      res.render('pages/admin', { status: '307', message: '', comm_name: resd[0].name, name: resd[0].uname});
    }
  })
})

app.get('/admin/polls', (req, res) => {
  let {email_id, password} = req.cookies;
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let comm_name = resd[0].name;
    if(req.cookies.comm_id){
      res.render('pages/polls_a', { status: '200', message: '', comm_name: resd[0].name, name: resd[0].uname});
    }else{
      res.render('pages/polls_a', { status: '307', message: '', comm_name: resd[0].name, name: resd[0].uname});
    }
  })
})

app.get('/polls/:comm_id', (req, res) => {
  let { comm_id } = req.params;
  con.query(`SELECT * FROM polls WHERE comm_id='${comm_id}';`, (err, resd) => {
    res.send(resd[0])
  })
})

app.get('/admin/invite', (req, res) => {
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let comm_name = resd[0].name;
    con.query(`SELECT * FROM invites WHERE comm_id='${req.cookies.comm_id}'`, (err, resdd) => {
      let newID = makeId(8);
      if(typeof resdd[0] !== 'undefined'){
        res.render('pages/invite_a', { invite_link: `http://localhost:8080/invite/${req.cookies.comm_id}/${resdd[0].invite_id}`, message: '', comm_name: resd[0].name, name: resd[0].uname})
      }else{
        con.query(`INSERT INTO invites(comm_id, invite_id) VALUES('${req.cookies.comm_id}', '${newID}')`);
        res.render('pages/invite_a', { invite_link: `http://localhost:8080/invite/${req.cookies.comm_id}/${newID}`, message: '', comm_name: resd[0].name, name: resd[0].uname})
      }
    })
  })
})

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}

app.get('/announcements', (req, res) => {
  con.query(`SELECT * FROM announcements WHERE comm_id='${req.cookies.comm_id}' AND DATE(date) > now() - INTERVAL 7 day;`, (err, resd) => {
    if(err) res.send({
      status: 400,
      message: 'An unexpected error occurred!'
    })
    res.send(resd.map(v => Object.assign({}, v)));
  })
})

app.get('/admin/announcements', (req, res) => {
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let comm_name = resd[0].name;
    con.query(`SELECT * FROM announcements WHERE comm_id='${req.cookies.comm_id}'`, (err, resdd) => {
      res.render('pages/announcements', { message: '', comm_name: resd[0].name, name: resd[0].uname, announcements: resdd})
    })
  })
})

app.post('/admin/announce', (req, res) => {
  let { announcement, description } = req.body;
  let announcement_id = makeId(11);
  con.query(`INSERT INTO announcements(announcement_id, announcement, description, comm_id) VALUES('${announcement_id}', '${announcement}', '${description}', '${req.cookies.comm_id}');`, (err, resd) => {
    if(err) return res.send({
      status: 400,
      message: 'An unexpected error occured!'
    })
    return res.send({
      status: 400,
      message: `Announced (ID: ${announcement_id})`
    })
  })
})

app.get('/admin/geninvite', (req, res) => {
  let { comm_id } = req.cookies;
  let invite_id = makeId(8);
  con.query(`DELETE FROM invites WHERE comm_id='${comm_id}'`)
  con.query(`INSERT INTO invites(comm_id, invite_id) VALUES('${comm_id}', '${invite_id}')`, (err, resd) => {
    if(err) return res.send({
      status: 400,
      message: 'An unexpected error occurred!'
    });
    res.send({
      status: 200,
      invite_link: `http://localhost:8080/invite/${comm_id}/${invite_id}`
    })
  })
})

app.post('/addPoll', (req, res) => {
  let pollId = makeId(12);
  con.query(`DELETE FROM polls WHERE comm_id='${req.cookies.comm_id}'`);
  con.query(`INSERT INTO polls(poll_id, title, options, comm_id) VALUES('${pollId}', '${req.body.title}', '${req.body.obj}', '${req.cookies.comm_id}')`, (err, resd) => {
    if(err) return res.send({
      status: 400,
      message: 'An error occured!'
    });
    res.send({
      status: 200,
      message: `Successfully added a poll (ID: ${pollId})`
    })
  })
})

app.post('/updatePoll', (req, res) => {
  let { comm_id, option } = req.body;
  console.log(req.body)
  con.query(`SELECT * FROM polls WHERE comm_id='${comm_id}';`, (err, resd) => {
    if(err) return res.send({
      status: 400, 
      message: 'An unexpected error occurred!'
    })
    let options = JSON.parse(resd[0].options);
    console.log(options)
    options[option.trim()]++;
    options = JSON.stringify(options);
    con.query(`UPDATE polls SET options='${options}' WHERE comm_id='${comm_id}';`)
    res.cookie('voted', 'true')
    res.send({
      status: 200,
      message: 'Success'
    })
  })
})

app.get('/complete', (req, res) => {
  let { email_id, user_id } = req.cookies;
  if(req.query.comm_id){
    con.query(`SELECT * FROM communities WHERE comm_id='${req.query.comm_id}';`, (err, resd) => {
      if(typeof resd == 'undefined') return res.render('pages/complete', {message: `The specified community doesn't exist`})
      con.query(`UPDATE users SET comm_id='${req.query.comm_id}' WHERE email_id='${email_id}';`, (errr, resdd) => {
        if(err) return res.render('pages/complete', {message: `An unexpected error occured!`});
        res.cookie('comm_id', `${req.query.comm_id}`)
        return res.render('pages/complete', { message: 'Sucessfully added you to the community. Now you can access the community dashboard.' })
      })
    })
  }else{
    res.render('pages/complete', { message: '' })
  }
})

app.get('/login', (req, res) => {
  let {email, password} = req.query;
  if(req.cookies.email_id){
    return res.render('pages/login', { success: true, message: '' }); 
  }
  if(Object.keys(req.query).length == 0){
    return res.render('pages/login', { success: false, message: '' }); 
  }
  con.query(`SELECT * FROM users WHERE email_id='${email}';`, (err, resd) => {
    if(!resd[0]) return res.render('pages/login', { success: false, message: `Email ID doesn't exist, please sign up!`});
    if(resd[0].password == password){
      res.cookie('email_id', `${email}`);
      res.cookie('password', `${password}`);
      res.cookie('user_id', `${resd[0].user_id}`);
      res.cookie('comm_id', `${resd[0].comm_id}`);
      return res.render('pages/login', { success: true, message: 'Successfully logged in!' })
    }else{
      return res.render('pages/login', { success: false, message: 'Wrong password!'})
    }
  })
})

app.get('/register', (req, res) => {
  let {email, password, name} = req.query;
  if(req.cookies.email_id){
    return res.render('pages/register', { success: true, message: '' }); 
  }
  if(Object.keys(req.query).length != 3){
    return res.render('pages/register', { success: false, message: '' }); 
  }
  con.query(`SELECT * FROM users WHERE email_id='${email}';`, (err, resd) => {
    if(resd[0]) return res.render('pages/register', { success: false, message: `Email ID already exist, please login!`});
    let user_id = makeId(10);
    con.query(`INSERT INTO users(email_id, password, user_id, comm_id, name, covid_pos, vaccinated, phone_no) values('${email}', '${password}', '${user_id}', '', '${name}', 0, 0, '')`, (errr, resdddd) => {
      if(errr){
        return res.render('pages/register', { success: false, message: 'An unexpected error occured!' });
      }else{
        res.cookie('email_id', `${email}`);
        res.cookie('password', `${password}`);
        res.cookie('user_id', `${user_id}`);
        return res.render('pages/register', { success: true, message: 'Successfully made an account!' });
      }
    })
  })
})

app.get('/invite/:comm_id/:invite', (req, res) => {
  let { comm_id, invite } = req.params;
  let { join } = req.query;
  con.query(`SELECT communities.name FROM invites INNER JOIN communities ON communities.comm_id = invites.comm_id WHERE invite_id='${invite}' AND communities.comm_id='${comm_id}';`, (err, resd) => {
    if(typeof resd == 'undefined') return res.render('pages/invite', { valid: false, message: `The given invite/community doesn't exist!`});
    if(join == 'true'){
      con.query(`UPDATE users SET comm_id='${comm_id}' WHERE email_id='${req.cookies.email_id}';`);
      res.cookie('comm_id', comm_id)
      return res.render('pages/invite', { comm_id: comm_id, comm_name: resd[0].name, invite: invite, valid: true, join: true});
    }
    res.render('pages/invite', { comm_id: comm_id, comm_name: resd[0].name, invite: invite, valid: true, join: false});
  })
})

app.get('/profile', (req, res) => {
  let {email_id, password} = req.cookies;
  if(!email_id) return res.render('pages/register', { success: false, message: '' });
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    con.query(`SELECT * FROM users WHERE email_id='${email_id}'`, (errr, resdd) => {
      if(req.cookies.comm_id){
        res.render('pages/profile', { status: '200', message: '', comm_name: resd[0].name, name: resd[0].uname, data: resdd[0]});
      }else{
        res.render('pages/complete', { message: '' });
      }
    })
  })
})

app.post('/profile/submit', (req, res) => {
  let { name, password, vaccinated, covid_pos, phone_no } = req.body;
  con.query(`UPDATE users SET name='${name}', password='${password}', vaccinated='${vaccinated}', covid_pos='${covid_pos}', phone_no='${phone_no}' WHERE email_id='${req.cookies.email_id}'`, (err, resd) => {
    if(err) {
      console.log(err)
      return res.send({
        status: 400,
        message: 'An unexpected error occurred!'
      })
    }
    res.send({
      status: 200,
      message: 'Successfully updated!'
    })
  })
})

app.get('/covid', (req, res) => {
  con.query(`SELECT COUNT(*) as people_c, COUNT(case when vaccinated=true then 1 else null end) as vaccinated_c, COUNT(case when covid_pos=true then 1 else null end) as covid_pos_c from users WHERE comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err){
      console.log(err);
      return res.send({
        status: 400,
        message: 'An unexpected error occurred!'
      })
    }
    res.send({
      status: 200,
      data: resd[0]
    })
  })
})

app.get('/generateComm', (req, res) => {
  con.query(`SELECT * FROM users WHERE email_id='${req.cookies.email_id}';`, (err, resd) => {
    if(err){
      console.log(err);
      return res.send({
        status: 400,
        message: 'An unexpected error occurred!'
      })
    }
    let newID = makeId(14);
    con.query(`INSERT INTO communities(name, comm_id, comm_admin, user_id) VALUES('${req.query.name}', '${newID}', '${resd[0].name}', '${req.cookies.user_id}');`, (errr, resdd) => {
      if(errr){
        console.log(rerr);
        return res.send({
          status: 400,
          message: 'An unexpected error occurred!'
        })
      }
      res.cookie('comm_id', `${newID}`);
      con.query(`UPDATE users SET comm_id='${newID}' WHERE email_id='${req.cookies.email_id}';`, (errrr, resdddd) => {
        if(errr){
          console.log(rerr);
          return res.send({
            status: 400,
            message: 'An unexpected error occurred!'
          })
        }
        return res.send({
          status: 200,
          comm_id: newID,
          message: 'Successfully added you to a community, now you can access the dashboard!'
        })
      })
    })
  })
})

app.get('/threads', (req, res) => {
  let {email_id, password} = req.cookies;
  if(!email_id) return res.render('pages/register', { success: false, message: '' });
  con.query(`SELECT communities.name, users.name as uname FROM communities INNER JOIN users ON users.comm_id = communities.comm_id WHERE communities.comm_id='${req.cookies.comm_id}' AND users.email_id='${req.cookies.email_id}' UNION SELECT communities.comm_admin, users.name FROM communities INNER JOIN users ON users.name = communities.comm_admin WHERE communities.comm_id='${req.cookies.comm_id}';`, (err, resd) => {
    if(err) return res.send('An unexpected error occured!');
    let { comm_id } = req.cookies;
    let { date, author } = req.query;
    console.log(comm_id, typeof date, typeof author)
    if(typeof author == 'undefined') {
      con.query(`SELECT * FROM threads WHERE comm_id='${comm_id}';`, (req, ress) => {
        let data = ress.map(v => Object.assign({}, v));
        return res.render('pages/com_threads', {
          data: data,
          comm_name: resd[0].name,
          name: resd[0].uname
        })
      })
    }else{
      con.query(`SELECT * FROM threads WHERE comm_id='${comm_id}' AND DATE(datetime) = '${date}' AND author = '${author}'`, (req, resdd) => {
        res.render('pages/com_threads', {
          data: resdd.map(v => Object.assign({}, v)),
          comm_name: resd[0].name,
          name: resd[0].uname
        })
      })
    }
  })
});

app.post('/addThreads', (req, res) => {
  let { thread_h, thread_c } = req.body;
  con.query(`SELECT * FROM users WHERE user_id='${req.cookies.user_id}';`, (err, resd) => {
    let name = resd[0].name;
    let comm_id = req.cookies.comm_id;
    console.log(name, comm_id, thread_h, thread_c);
    con.query(`INSERT INTO threads(comm_id, thread_h, thread_c, replies, likes, author) VALUES("${comm_id}", "${thread_h}", "${thread_c}", '[]', "0", "${name}");`);
    return res.send('success')
  })
})

app.post('/addReply', (req, res) => {
  let { comm_id } = req.cookies;
  let { date, author, reply } = req.body; 
  con.query(`SELECT * FROM threads WHERE comm_id='${comm_id}' AND DATE(datetime) = '${formatDate(new Date(date))}' AND author = '${author}'`, (req, resdd) => {
    let data = resdd;
    let replies = JSON.parse(data[0].replies);
    console.log(replies)
    let x = `{ "${author}": ${JSON.stringify({"con": `${reply}`,"date": new Date().toLocaleString(),"likes": "0"})} }`
    replies.push(JSON.parse(x));
    replies = JSON.stringify(replies);
    con.query(`UPDATE threads SET replies='${replies}' WHERE comm_id='${comm_id}' AND DATE(datetime) = '${formatDate(new Date(date))}' AND author = '${author}';`)
    res.send({
      replies: replies
    });
  })
})

app.get('/returnThreads', (req, res) => {
  let { comm_id } = req.cookies;
  con.query(`SELECT * FROM threads WHERE comm_id='${comm_id}' AND DATE(datetime) > now() - INTERVAL 14 day;`, (err, resd) => {
    if(err) return res.send({
      status: 400,
      message: 'An unexpected error occurred!'
    })
    return res.send(resd.map(v => Object.assign({}, v)))
  })
})

app.get('/likeThread', (req, res) => {
  let { comm_id } = req.cookies;
  let { date, author } = req.query; 
  con.query(`SELECT * FROM threads WHERE comm_id='${comm_id}' AND DATE(datetime) = '${formatDate(new Date(date))}' AND author = '${author}'`, (req, resdd) => {
    let data = resdd;
    let likes = `${parseInt(data[0].likes) + 1}`;
    con.query(`UPDATE threads SET likes='${likes}' WHERE comm_id='${comm_id}' AND DATE(datetime) = '${formatDate(new Date(date))}' AND author = '${author}';`)
    res.send(likes);
  })
})

function makeId(l) {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('').sort(()=>{return 0.5-Math.random()}).join('').substring(0, l);
}

app.listen(8080);
console.log('Server is listening on port 8080');
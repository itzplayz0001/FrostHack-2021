const mysql = require('mysql2');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "skjj54kol",
    database : 'communities'
});

con.connect();

module.exports = con;
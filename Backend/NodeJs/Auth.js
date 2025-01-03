let temSt  = {};
let temSt2 = {};
let temSt3 = {};
let temSt4 = {};
let temSt5 = {};
let temSt6 = {};
let temSt7 = {};
let temSt8 = {};
let temSt9 = {};
let temSt10 = new Map();
const express = require('express');
const cors = require('cors'); // Import CORS middleware
const app = express();
const cookie = require('cookie-parser')
app.use(cookie());
let sql = require("mysql");
const path = require("path");
const nodemailer = require('nodemailer');
app.use(express.urlencoded({ extended: true }));
const port = 8000; // You can use any port you like
const multer = require('multer');
const jwt = require('jsonwebtoken')
// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(express.json());
app.use(express.static('../../public'));
var con = sql.createConnection({
    host: "localhost",
    user: "root",
    database: "de_project"
});

app.post("/registration", (req, res) => {
    let data = req.body;
    let a = 0;
    q = "select * from stu_registration where Username = ?;";
    const x = [data.Username];
    con.query(q, x, async (err, results) => {
        if (err) {
            console.log("error in registration : " + err);
        }
        else if (results.length == 0) {
            let otp = Math.floor(100 + Math.random() * 900);
            let res = "OTP " + otp + " Username " + x;
            let mailTransporter =
                nodemailer.createTransport(
                    {
                        service: 'gmail',
                        auth: {
                            user: '220170116016@vgecg.ac.in',
                            pass: 'Bg@13572'
                        }
                    }
                );
            let mailDetails = {
                from: '220170116016@vgecg.ac.in',
                to: data.StuEmail,
                subject: "junior's friend website registration",
                text: res
            };
            mailTransporter.sendMail(mailDetails,
                function (err, data) {
                    if (err) {
                        console.log('Error Occurs' + err);
                    } else {
                        //  console.log('Email sent successfully');
                    }
                });
            temSt[x] = data.StuName;
            temSt2[x] = data.EnrollmentNo;
            temSt3[x] = data.StuEmail;
            temSt4[x] = data.Semester;
            temSt5[x] = data.Department;
            temSt6[x] = data.StuPhoto;
            temSt7[x] = data.StuCity;
            temSt8[x] = data.StuBirthdata;
            temSt9[x] = otp;
            temSt10[x] = data.Password;
            a = 1;
        }
        if (a === 1) {
            res.sendFile("C:/Users/HP/Desktop/dePrototype/public/otp.html");
        }
        else {
            res.send("username already taken please choose another");
        }
    })
})
app.post("/otp", (req, res) => {
    let data = req.body;
    let otp = data.otp;
    let x = req.body.username;
    let otp2 = temSt9[x];
    if (otp == otp2) {
        let data = [temSt[x], temSt2[x], temSt3[x], temSt4[x], temSt5[x], temSt6[x], temSt7[x], temSt8[x], x, temSt10[x]];
        q = "insert into stu_registration(StuName,EnrollmentNo,StuEmail,Semester,Department,StuPhoto,StuCity,StuBirthDate,Username,Password) values(? , ? , ? , ? , ? , ? , ? , ? , ? , ?);";
        con.query(q, data, (err) => {
            if (err) {
                console.log("error in inserting data " + err);
            }
            else {
                delete temSt[x];
                delete temSt2[x];
                delete temSt3[x];
                delete temSt4[x];
                delete temSt5[x];
                delete temSt6[x];
                delete temSt7[x];
                delete temSt8[x];
                delete temSt9[x];
                delete temSt10[x];
                res.sendFile("C:/Users/HP/Desktop/dePrototype/public/home.html");
                //console.log(req.body);
            }
        });
        //res.send("done");
    }
    else {
        res.send("wrong otp or username");
    }
})
app.post("/login", (req, res) => {
    let data = [req.body.UserName];
    q = "SELECT * FROM stu_registration WHERE Username = ?";
    con.query(q, data, (error, results) => {
        if (error) {
            console.log("error i login ", error);
        }
        if (results.length == 0) {
            res.send("account not found(wrong username)");
        }
        else {
            let data = [req.body.UserName, req.body.password];
            q = "SELECT * FROM stu_registration WHERE Username = ? and Password= ?";
            con.query(q, data, (error, results) => {
                if (error) {
                    console.log("error in login ", error);
                }
                if (results.length == 0) {
                    res.send("wrong password");
                }
                else {
                    const userId = req.body.UserName;
                    const token = jwt.sign({userId},"secretKey",{
                    expiresIn:'10d'
                });
                    res.cookie("jwt",token,{
                        maxAge :10*24*60*60*1000,
                        httpOnly:true,
                    });
                
                    res.sendFile("C:/Users/kamal/Desktop/DEproject/dePrototype/public/home.html");
                    //console.log(req.body);
                }
            })
        }
    })
})
app.post("/forgot", (req, res) => {
    let username = [req.body.username];
    q = "SELECT password,StuEmail FROM stu_registration WHERE Username = ? ;";
    con.query(q, username, (error, results) => {
        if (error) {
            throw error;
        }
        if (results.length == 0) {
            res.send("account not found");
        }
        else {
            let x = JSON.stringify(results);
            let userData = JSON.parse(x);
            let a = "your account password is " + userData[0].password;
            let mailTransporter =
                nodemailer.createTransport(
                    {
                        service: 'gmail',
                        auth: {
                            user: '220170116016@vgecg.ac.in',
                            pass: 'Bg@13572'
                        }
                    }
                );
            let mailDetails = {
                from: 'sanskritiratnam@gmail.com',
                to: userData[0].StuEmail,
                subject: "Junior's Friend Website Forgot Password",
                text: a
            }
            mailTransporter.sendMail(mailDetails,
                function (err, data) {
                    if (err) {
                        console.log('Error Occurs' + err);
                    } else {
                        console.log("forget email sended");
                        res.send("email sended succesfully");
                    }
                });
        }

    })
})

app.get('/api/books', (req, res) => {
    con.query('SELECT * FROM book', (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching books');
        }
        res.json(results); // Send results as JSON
    });
});
app.post('/save_post',(req, res) => {
    // Use multer to handle file uploads
    upload.single('bookImage')(req, res, (err) => {
        if (err) {
            console.error('Error processing file upload:', err);
            return res.status(500).send('File upload error.');
        }

        // Extract data from req.body
        const { bookName, price, description, publication} = req.body;
        const token = req.cookies.jwt;
        const decodeJwt = jwt.verify(token,'secretKey');
        const username =decodeJwt.userId;
        const currentDate = new Date();
        const posted_timestamp = currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        
       
        const sql = `
            INSERT INTO book (bookName, username,price, description, publication, posted_timestamp)
            VALUES (?, ?, ?, ?,?, ?)
        `;
        con.query(sql, [bookName,username, price, description, publication, posted_timestamp], (err, result) => {
            if (err) {
                return res.status(500).send('Failed to post book.');
            }

            console.log('Book posted successfully:', result);
            res.send('Book posted successfully!');
        });
    });
});
app.get("/home",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/DEproject/dePrototype/public/home.html");

})
con.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("database done")
})
app.listen(port, () => {
    console.log("server start on port " + port);
})
const otpTempStore = {}; // Temporary store for OTPs
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const con = require('../config/db');

const registration = async (req,res)=>{
     const data = req.body;
        const username = data.Username;
    
        con.query("SELECT * FROM stu_registration WHERE Username = ?", [username], async (err, results) => {
            if (err) return res.status(500).send("DB error");
    
            if (results.length > 0) {
                return res.send("Username already taken. Please choose another.");
            }
    
            const otp = Math.floor(100 + Math.random() * 900);
            const emailBody = `OTP: ${otp} | Username: ${username}`;
    
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: '220170116016@vgecg.ac.in',
                    pass: 'miob tpsg xlyx ufpn'
                }
            });
    
            const mailDetails = {
                from: '220170116016@vgecg.ac.in',
                to: data.StuEmail,
                subject: "Junior's Friend Website Registration",
                text: emailBody
            };
    
            transporter.sendMail(mailDetails, (err) => {
                if (err) 
                {
                    console.log('Error Occurs' + err);
                    return res.status(500).send("Email sending failed");
                }
    
                // Save temporary data in unified store
                otpTempStore[username] = {
                    otp,
                    data
                };
    
                res.redirect('otp.html');
            });
        });
    

}

const verifyOtp = async (req, res) => {
    const { username, otp } = req.body;

    const record = otpTempStore[username];
    if (!record) return res.send("OTP expired or invalid username");

    if (parseInt(otp) !== record.otp) return res.send("Wrong OTP");

    const d = record.data;
    const values = [
        d.StuName, d.EnrollmentNo, d.StuEmail, d.Semester,
        d.Department, d.StuPhoto, d.StuCity, d.StuBirthdata,
        username, d.Password
    ];

    const q = `INSERT INTO stu_registration
        (StuName, EnrollmentNo, StuEmail, Semester, Department, StuPhoto, StuCity, StuBirthDate, Username, Password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    con.query(q, values, (err) => {
        if (err) 
        {
            console.log("Error inserting data: ", err);
            return res.status(500).send("Database insertion failed");
        }

        delete otpTempStore[username]; // clean up
       res.redirect('login.html');
    });
}

const login =async (req, res) => {
      const UserName = req.body.UserName;
        const password = req.body.password;
        q = "SELECT * FROM stu_registration WHERE Username = ?";
        con.query(q, UserName, (error, results) => {
            if (error) {
                console.log("error i login ", error);
            }
            if (results.length == 0) {
                res.send("account not found(wrong username)");
            }
            else {
                const data = [UserName, password];
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
                        })
                        
                        res.status(200).json({
                            success:true,
                        })
                    }
                })
            }
        })
    }

const logout = (req, res) => {
    res.clearCookie("jwt");
    res.status(200).json({success:true});
}

const checkLogins = (req, res) => {
    const jwt = req.cookies.jwt;
    return jwt? res.status(200).json({msg: " okay"}) : res.status(400).json({msg : "no"})
}

const forgetPassword = async(req,res)=>{
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
                            pass: 'Bg@13572468'
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
}

module.exports = {
    registration,
    verifyOtp,
    login,
    logout,
    checkLogins,
    forgetPassword
}
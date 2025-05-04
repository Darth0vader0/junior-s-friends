

const express = require('express');
const app = express();
const cookie = require('cookie-parser')
app.use(cookie());
const { v4: uuidv4 } = require('uuid');
app.use(express.urlencoded({ extended: true }));
const port = 8000; // You can use any port you like
const multer = require('multer');
const jwt = require('jsonwebtoken');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bodyParser = require('body-parser');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
const path = require('path');
app.use(express.static('../public'));
const con = require('./src/config/db');
con.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("database done")
})

const authController = require('./src/controllers/auth.controller.js');

app.get('/logout',authController.logout)
app.post("/registration", authController.registration);
app.post("/otp",authController.verifyOtp );
app.post("/login",authController.login )
app.get("/check-logins",authController.checkLogins );

// book store apis 

app.get('/books',(req, res) => {
    con.query('SELECT * FROM book', (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching books');
        }
        res.json(results)
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
            res.redirect('/resources')
        });
    });
});

// comment section 
app.post("/CommentAdd", (req, res) => {
    //consider name
    let { BookID, Comments,PostedBy } = req.body;
    Uname = req.cookies.jwt;
    const decodeJwt = jwt.verify(Uname, 'secretKey');
    Uname = decodeJwt.userId;
    if (!Uname || !Comments) {
        return res.status(400).json({ message: 'data not proper' });
    }
    const CommentID = uuidv4();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const localDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const data = [CommentID, Uname, BookID, PostedBy,Comments, localDateTime];
    const sql = 'INSERT INTO comments (CommentID, UserName,BookID,PostedBy,Comment,Time) VALUES (?, ?, ?,?, ?,?)';
    con.query(sql, data, (err, result) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: 'comment added succesfully' });
    });
})

app.post("/Fetch-comments", (req, res) => {
    const BookID = req.body.BookID;
    const PostedBy = req.body.PostedBy;
   
    if (!BookID||!PostedBy) {
        return res.status(400).json({ message: 'something is missing' });
    }
    // fetch comments order by last most recent comment first
    const sql = `SELECT * ,CONVERT_TZ(Time, '+00:00', '+05:30') AS created_at_local FROM Comments WHERE BookID = ? AND PostedBy= ? ORDER BY Time DESC;`;
    con.query(sql, [BookID,PostedBy], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'you already comment' });
        }
        if (result.length == 0) {
            return res.status(404).json({ message: 'not found comments' });
        }
        res.json(result.map(row => ({
            Username: row.username,
            Comment: row.Comment
        })));
    })
})

// user-profile redirect .
app.get('/user',(req,res)=>{
    const token = req.cookies.jwt;
    const decodeJwt = jwt.verify(token, 'secretKey');
    const userId = decodeJwt.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const sql2 = 'SELECT * FROM stu_registration WHERE Username = ?';
    con.query(sql2, [userId], (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Database error' });
        } else if (result.length === 0) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
        } else {
            res.json({ success: true, data: result[0] });
        }
    });
})
app.post("/userData", (req, res) => {
    const Username = req.body.username;
    if (!Username) {
        return res.status(400).json({ message: 'username required' });
    }
    const sql = "SELECT * FROM stu_registration Where username = ?";
    con.query(sql, [Username], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Server error' });
        }
        else if (result.length === 1) {
           const response= result.map(row => ({
            
                StuName: row.StuName,
                EnrollmentNo: row.EnrollmentNo,
                StuEmail: row.StuEmail,
                Semester: row.Semester,
                Department: row.Department, 
                StuCity: row.StuCity,                
                Username: row.Username
            }));
            res.json(response[0]);
        }
        else {
            return res.status(500).json({ message: 'Error in database' });
        }
    })
})

app.get('/adminData', (req, res) => {
   const sql = 'SELECT * FROM stu_registration';
   const token = req.cookies.jwt;
   const decodeJwt = jwt.verify(token, 'secretKey');
    const userId = decodeJwt.userId;
    const data = {};
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const sql2 = 'SELECT * FROM admin_users WHERE name = ?';
    con.query(sql2, [userId], (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Database error' });
        } else if (result.length === 0) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
        } else {
         data.admin = result[0].name;
        }
    })

    con.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ success: false, message: 'Database error' });
        } else {
            data.users = result;
            res.json({ success: true, data: data });
        }
    });   
})
app.post('/events', (req, res) => {
    const { title, date, time, location, description, category } = req.body;
  
    const sql = `INSERT INTO events (title, date, time, location, description, category) VALUES (?, ?, ?, ?, ?, ?)`;
    con.query(sql, [title, date, time, location, description, category], (err, result) => {
      if (err) {
        console.error(err);
        res.json({ success: false });
      } else {
        res.json({ success: true });
      }
    });
  });
  
app.get('/getEvents',async (req,res)=>{
    const query = 'SELECT * from events';
    const events =  con.query("SELECT * FROM events ORDER by date,time", (err, result) => {
        if (err) {
            console.error('Error fetching events:', err);
            res.status(500).json({ success: false, message: 'Database error' });
          } else {
            res.json({ success: true, events:result });
          }
        } 
    );
   

})
app.post('/loginAsAdmin',(req,res)=>{
    const { UserName, password } = req.body;
    console.log(UserName, password)
     con.query('SELECT * FROM admin_users WHERE name = ? AND password = ?', [UserName, password], (err, results) => {

        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (results.length > 0) {
            console.log('Login successful:', results[0]);
            // Successful login 
             const userId = req.body.UserName;
                    const token = jwt.sign({userId},"secretKey",{
                        expiresIn:'10d'
                        
                         });
                         res.cookie("jwt",token,{
                            maxAge :10*24*60*60*1000,
                            httpOnly:true,
                        })
            res.status(200).json({ success: true });
            
        } else {
            console.log('Invalid credentials:', UserName, password);
            // Invalid credentials
            res.json({ success: false });
        }
    }
    );
})

// database connection 


// routes for url bar to enhance user experience 
app.get("/login",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/login.html");

})
app.get("/admin",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/adminDashboard.html");

})
app.get("/resources",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/books.html"); // Send results as JSON

})

app.get('/user-profile',(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/profile.html");
})
app.get('/profile',(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/dashboard.html");
})
app.get("/home",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/home.html");

})
app.get("/post",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/post_book.html");
})
app.get("/otp",(req,res)=>{
    res.sendFile("C:/Users/kamal/Desktop/dePrototype/public/otp.html")
});


app.listen(port, () => {
    console.log("server start on port " + port);
})
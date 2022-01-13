const express = require('express');
const app = express();
const knex = require('knex')
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const { json } = require('express/lib/response');
const res = require('express/lib/response');

const db = knex({
    client: 'pg',
    connection:{
        host: '127.0.0.1',
        user : 'postgres',
        password: 'Kevthebest12@',
        database: 'Frend'
    }
});



app.use(express.json());
app.use(cors());




app.post('/Register', (req, res)=>{
    const {email, name, password, username} = req.body;
    const hash =  bcrypt.hashSync(password);

    db.transaction(trx =>{
        trx.insert({
            hash: hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    name:name,
                    username: username,
                    email:loginEmail[0],  
                    joined:new Date(),
                }).then(user => { //returning User array
                    res.json(user[0]);
                })

        })
        .then(trx.commit)
        .catch(trx.rollback)
    })       //for security reasons we use transaction to check if the register is apart of the login if its not them both code block fails and nobody get in that way
    
    .catch(err => res.status(400).json('unable to register'))
    
})

app.post('/currentUser', (req, res) => {
    const {username, name, profilepic, uid} = req.body;

    db('currentuser').insert({
        username: username,
        name: name,
        profilepic: profilepic,
        uid: uid
    }).then(response => res.json('Successful'))

})

app.get('/retrievePost', (req,res) =>{
    db.select('*').from('songpost').then(data =>{
        res.json(data);
    })
})


app.get('/Suggest', (req,res) => {
    db.select('*').from('currentuser').then(data => res.json(data))
})

app.post('/likeTotal', (req, res) => {
    const {post_id} = req.body
    db('like_post').count('like_id')
    .where('post_id', '=', post_id).then(response => res.json(response[0]))
})

app.post('/setLike', (req, res) =>{
    const {user_id, post_id} = req.body

    db('like_post').insert({
        user_id: user_id,
        post_id: post_id
    }).returning('*').then(response => res.json(response[0]))
})

app.get('/allLikes', (req,res) => {
    db.select('*').from('like_post').then(data =>{
        res.json(data)
    })
})



app.post('/delLike', (req, res) =>{
    const {like_id} = req.body
    db('like_post')
        .where({like_id:like_id})
        .del().then(response => res.json("success"))
    })

app.post('/Like', (req,res) =>{
   db('songpost')
    .where('id', '=', req.body.id)
    .increment({
        likes: 1
    }).then(response => res.json(response))
})
app.post('/UnLike', (req,res) =>{
    db('songpost')
     .where('id', '=', req.body.id)
     .decrement({
         likes: 1
     }).then(response => res.json(response))
 })


app.post('/post', (req,res) =>{
    const {peep,  urlimage, artistname, songname, urlaudio, profilepic, username, name} = req.body;

    db('songpost').insert({
        peep:peep,
        urlimage:urlimage,
        artistname: artistname,
        songname: songname,
        urlaudio:urlaudio,
        profilepic: profilepic,
        username:username,
        name: name
    })
    .returning('*')
    .then(post => res.json(post))
    
  
})

app.get('/profile', (req,res) =>{
    const {email} = req.params;
    console.log(email);
    db.select('email').from('users').where('email', '=', email)
    .then(user =>{
        res.json(user[0]);
    })
    .catch(err => res.status(400).json("didnt find user"))
})

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json('unable to get user'))
        }else{
            res.status(400).json('wrong credentiaLS')
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/retrievepic', (req,res) =>{
    db.select('*').from('currentuser')
    .where('uid', '=', req.body.uid)
    .then(data => res.json(data[0]))
})



app.listen(3000, ()=>{
    console.log("We are listening")
});
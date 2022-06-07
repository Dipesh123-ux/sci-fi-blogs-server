const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors')

const blogRoutes =  require('./routes/blog');
const authRoutes =  require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category')
const tagRoutes =  require('./routes/tag')




const app = express();

app.use(cors())

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

//routes 



// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader(
//     'Access-Control-Allow-Methods',
//     'OPTIONS, GET, POST, PUT, PATCH, DELETE'
//   );
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });


app.use('/api',blogRoutes);
app.use('/api',authRoutes);
app.use('/api',userRoutes);
app.use('/api',categoryRoutes);
app.use('/api',tagRoutes);
 

const port = process.env.PORT || 8080;


mongoose
  .connect(process.env.DATABASE,{ useNewUrlParser: true ,useUnifiedTopology: true}
  )
  .then(result => {
    app.listen(port);
  })
  .catch(err => console.log(err));

 

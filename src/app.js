'use strict';
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const { loadUserContext } = require('./middlewares/auth');
const { csrfProtection } = require('./middlewares/csrf');
const { notFound, errorHandler } = require('./middlewares/errors');
const app = express();
app.disable('x-powered-by');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(helmet({contentSecurityPolicy:{directives:{'style-src':["'self'","'unsafe-inline'"]}}}));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(session({
  name: 'edugestion.sid',
  secret: process.env.SESSION_SECRET || 'solo-desarrollo-cambiar-antes-de-publicar-123456',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 }
}));
app.use(loadUserContext);
app.use((req,res,next)=>{res.locals.requestPath=req.path;next();});
app.use(csrfProtection);
app.use('/', require('./routes/auth.routes'));
app.use('/perfil', require('./routes/perfil.routes'));
app.use('/admin', require('./routes/admin.routes'));
app.use('/docente', require('./routes/docente.routes'));
app.use('/estudiante', require('./routes/estudiante.routes'));
app.use(notFound);
app.use(errorHandler);
module.exports = app;

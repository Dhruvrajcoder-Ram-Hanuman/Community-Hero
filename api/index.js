// Vercel Serverless Function entry point
// This re-exports the Express app so Vercel can serve it as a serverless function
const app = require('../backend/server.js');

module.exports = app;

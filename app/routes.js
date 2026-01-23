//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

module.exports = router

// Add your routes here



  // GET SPRINT NAME - useful for relative templates   - added from Vickyteinaki.com
router.use('/', (req, res, next) => {  
  res.locals.currentURL = req.originalUrl; //current screen  
  res.locals.prevURL = req.get('Referrer'); // previous screen

console.log('folder : ' + res.locals.folder + ', subfolder : ' + res.locals.subfolder  );

  next();  
});
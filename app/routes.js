//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
require('dotenv').config()
   console.log('DOTENV TEST — KEY:', process.env.FLOOD_APP_AZURE_MAPS_KEY)
   console.log('DOTENV TEST — URL:', process.env.FLOOD_APP_AZURE_MAPS_URL)

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

module.exports = router

// Add your routes here - above the module.exports line
router.get('/version5/map-azure', (req, res) => {
  console.log('version5/map-azure: get')

  // Pass Azure Maps credentials from environment variables to the template
  const azureMapsKey = process.env.FLOOD_APP_AZURE_MAPS_KEY
  const azureMapsUrl = process.env.FLOOD_APP_AZURE_MAPS_URL

  if (!azureMapsKey || !azureMapsUrl) {
    console.warn('Warning: Azure Maps environment variables not set')
  }

  res.render('version5/map-azure', {
    azureMapsKey,
    azureMapsUrl
  })
})

router.get('/version5/map-azure2', (req, res) => {
  console.log('/version5/map-azure2: get')

  const azureMapsKey = process.env.FLOOD_APP_AZURE_MAPS_KEY
  const azureMapsUrl = process.env.FLOOD_APP_AZURE_MAPS_URL

  if (!azureMapsKey || !azureMapsUrl) {
    console.warn('Warning: Azure Maps environment variables not set')
  }

  res.render('version5/map-azure2', {
    azureMapsKey,
    azureMapsUrl
  })
})



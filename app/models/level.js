const utils = require('../utils')

class Level {
  constructor (data) {
    this.id = data.id
    this.name = data.name
    this.state = data.state
    this.value = data.value
    this.valueDownstream = data.value_downstream
    this.value1hr = data.value_1hr
    this.value6hr = data.value_6hr
    this.value24hr = data.value_24hr
    this.valueDate = data.value_date
    this.elapsedTime = data.value_date ? utils.formatElaspedTime(data.value_date) : ''
    this.type = data.type
    this.riverSlug = data.river_slug || ''
    this.isDownstream = Boolean(data.is_downstream)
  }
}
module.exports = Level

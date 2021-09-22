const fs = require('fs')
const GIFEncoder = require('gifencoder')
const PNG = require('png-js')

function decode(png) {
  return new Promise((r) => {
    png.decode((pixels) => r(pixels))
  })
}

async function gifAddFrame(
  page,
  encoder,
  resolution = { width: 1024, height: 768 }
) {
  const pngBuffer = await page.screenshot({
    clip: { ...resolution, x: 0, y: 0 },
  })
  const png = new PNG(pngBuffer)
  await decode(png).then((pixels) => encoder.addFrame(pixels))
}

let encoder

module.exports = {
  beforeAll: () => {
    if (!process.env.RECORD_TEST) {
      return
    }
    encoder = new GIFEncoder(1024, 768)
    encoder
      .createWriteStream()
      .pipe(fs.createWriteStream('ui-testing-recording.gif'))
    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(500)
    encoder.setQuality(5)
  },
  afterAll: async () => {
    if (process.env.RECORD_TEST) {
      encoder.finish()
    }
  },
  afterEach: async (page, resolution) => {
    if (!process.env.RECORD_TEST) {
      return
    }
    await gifAddFrame(page, encoder, resolution)
  },
  asyncForEach: async function (array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  },
}

const fetch = require('node-fetch')
const fs = require('fs')

const BASE_URL = 'https://json-bins.herokuapp.com'
;(async () => {
  const args = process.argv.slice(2)
  if (!args.length) {
    console.log('name missing')
    process.exit(1)
  }
  const name = args.shift()
  const data = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      tasks: {
        todo: [],
        'in-progress': [],
        done: [],
      },
    }),
  })
  const binId = (await data.json()).binId
  fs.writeFileSync(
    require('path').join(__dirname, '..', 'api-data.txt'),
    `
Your bin ID: ${binId}
To fetch the data in the bin: [GET] ${BASE_URL}/bin/${binId}
To change the data in the bin: [PUT] ${BASE_URL}/bin/${binId} body={tasks}
    The format of the tasks is the same as in the localStorage.
  `
  )
})()

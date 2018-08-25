const fs = require('fs')
const { promisify } = require('util')
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

async function parseDirectory (directory) {
  const filenames = await readDir(directory)
  const strArr = await Promise.all(
    filenames.map((filename) =>
      readFile(directory + filename, {encoding: 'utf8'})
    )
  )

  const db = {}
  strArr.forEach((str, i) => {
    const allData = JSON.parse(str.split('INITIAL_STATE = ')[1].split('window.csrfToken')[0].replace('};', '}'))
    
    const firstStore = Object.entries(allData.eaterStores.eaterStores)[0][1]

    const sectionsItems = Object.entries(
      firstStore.data.store.sectionEntitiesMap
    ).reduce((acc, item) => acc.concat(
      Object.entries(item[1].itemsMap).map(item => item[1])
    ), [])

    sectionsItems.forEach(item => {
      // console.log(JSON.stringify(item, null, 2))
      db[item.uuid] = {
        id: item.uuid,
        title: item.title,
        description: item.itemDescription,
        price: item.price,
      }
    })
  })

  // await writeFile('data.xlsx', json2xls(db), 'binary')
  console.log(JSON.stringify(db, null, 2))
}
parseDirectory('./data/').catch(console.error)

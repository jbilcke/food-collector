const fs = require('fs')
const { promisify } = require('util')
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const guessType = (title, description) => {
  const model = {
    burger: '(?:hamb|cheese)?burg(?:é|er)',
    pizza: 'pizza',
    bobun: '(?:bobun|bo bun|bun bo|bòbún|bò bún|bún bò nam bộ|bún bò|bún thịt nướng bò)',
    pasta: 'pâtes|pates|pasta|spaghetti|linguine|orechiette|tagliolini',
    risotto: 'risotto',
    ceviche: 'ceviche',
    chirashi: 'chirashi',
    donburi: 'donburi',
    pokebowl: 'pok(?:e|é)\s?bowl',
    sandwich: 'sandwich(?:es)?',
    bagel: 'bagels?',
    salad: 'salade?',
    burrito: 'burrito',
    'taco': 'tacos?',
    side: 'naan|nachos|chips|barquette de frites',
    alcohol: 'bière|beer|vin blanc|vin rouge|vin rosé|champagne|bordeaux',
    drink: '7up|san pellegrino|perrier|coca|cola|coca-cola|vittel|oasis|orangina|sprite|ice tea|jarrito',
    dessert: 'beignets?|chouquettes?|cookies?|cheesecake|carrotcake|cake|mousse au chocolat|chocolat|tiramisu|pannacota',
    crepe: 'cr(?:ê|è|e)pe|froment|blé noir',
  }
  return Object.entries(model).reduce((acc, [key, pattern]) => {
    const regexp = new RegExp(pattern, 'i')
    if (title.match(regexp) || description.match(regexp)) {
      return acc.concat(key)
    } else {
      return acc
    }
  }, [])
}

async function parseDirectory (directory) {
  const filenames = await readDir(directory)
  const db = {}
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i]
    // console.log('filename: ' + filename)
    try {
      const str = await readFile(directory + filename, {encoding: 'utf8'})
      // console.log('str: ' + str)
      const allData = JSON.parse(str.split('INITIAL_STATE = ')[1].split('window.csrfToken')[0].replace('};', '}'))
      
      const firstStore = Object.entries(allData.eaterStores.eaterStores)[0][1]

      const sectionsItems = Object.entries(
        firstStore.data.store.sectionEntitiesMap
      ).reduce((acc, item) => acc.concat(
        Object.entries(item[1].itemsMap).map(item => item[1])
      ), [])

      const restaurant = filename.split(' Delivery _ Paris _')[0]
      sectionsItems.forEach(item => {
        db[`${restaurant} >> ${item.title}`] = {
          // id: item.title,
          restaurant: restaurant,
          type: guessType(item.title, item.itemDescription)[0],
          price: (item.price / 100).toString().replace('.', ','),
          name: item.title,
          description: item.itemDescription,
        }
      })
    } catch (exc) {
      
    }
  }

  console.log('"restaurant";"type";"prix";"nom";"description"')
  Object.entries(db).forEach(([ id, item ]) => {
    console.log(
      Object.entries(item).map(value => JSON.stringify(value[1])).join(";")
    )
  })
}
parseDirectory('./data/').catch(console.error)
